import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { spawn, exec } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio robusto para gestionar la conexión a MongoDB
 * Implementa reintentos automáticos, detección de MongoDB inactivo y tentativa de iniciar el servicio
 */
@Injectable()
export class MongoDBConnectionService {
  private readonly logger = new Logger(MongoDBConnectionService.name);
  private isMongoRunning = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5; // Solo 5 intentos, pero reparando problemas
  private initialDelay = 2000; // 2 segundos inicial
  private maxDelay = 5000; // máximo 5 segundos
  private mongoStarted = false; // Flag para saber si ya iniciamos MongoDB

  constructor(private configService: ConfigService) {}

  /**
   * Intenta establecer conexión a MongoDB con reintentos automáticos
   * @returns Promise que se resuelve cuando la conexión es exitosa
   */
  async connectWithRetry(): Promise<void> {
    const mongoUri = this.configService.get<string>(
      'MONGODB_URI',
      'mongodb://localhost:27017/shieldtrack',
    );

    this.logger.log(`📦 Iniciando servicio de conexión a MongoDB`);
    this.logger.log(`🔗 URI de conexión: ${mongoUri}`);

    // PASO 1: Diagnosticar y reparar ANTES de intentar
    await this.diagnoseAndRepair();

    // PASO 2: Intentar conectar con reintentos reducidos
    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        this.logger.log(
          `⏳ Intento ${this.connectionAttempts + 1}/${this.maxConnectionAttempts} de conexión a MongoDB`,
        );

        await this.testMongoConnection(mongoUri);
        this.isMongoRunning = true;
        this.logger.log('✅ Conexión a MongoDB establecida correctamente');
        return;
      } catch (error) {
        this.connectionAttempts++;

        if (this.connectionAttempts < this.maxConnectionAttempts) {
          const delay = this.calculateBackoffDelay(this.connectionAttempts);
          this.logger.warn(`❌ Error al conectar a MongoDB: ${error.message}`);
          this.logger.log(`🔄 Reintentando en ${delay}ms (intento ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
          await this.delay(delay);
        } else {
          this.logger.error(`❌ No se pudo conectar a MongoDB después de ${this.maxConnectionAttempts} intentos`);
          this.logger.error('💡 Diagnóstico:');
          this.logger.error('   - Verifique que MongoDB esté instalado');
          this.logger.error('   - Revise los logs del sistema');
          this.logger.error('   - Intente iniciar MongoDB manualmente: mongod');
          throw new Error(`MongoDB no disponible después de diagnosticar y reparar`);
        }
      }
    }
  }

  /**
   * Diagnostica y repara problemas comunes de MongoDB
   */
  private async diagnoseAndRepair(): Promise<void> {
    this.logger.log('🔍 DIAGNOSTICANDO problemas de MongoDB...');

    // 1. Verificar si el puerto 27017 está ocupado
    await this.checkAndFixPort27017();

    // 2. Verificar/crear directorio de datos
    await this.ensureDataDirectory();

    // 3. Limpiar locks de MongoDB
    await this.cleanMongoLocks();

    // 4. Intentar iniciar MongoDB
    if (!this.mongoStarted) {
      this.logger.log('🚀 Intentando iniciar MongoDB...');
      await this.tryStartMongoDB();
      this.mongoStarted = true;
    }

    this.logger.log('✅ Diagnóstico completado');
  }

  /**
   * Verifica y libera el puerto 27017 si está ocupado
   */
  private async checkAndFixPort27017(): Promise<void> {
    try {
      const platform = os.platform();
      this.logger.log('🔍 Verificando puerto 27017...');

      if (platform === 'win32') {
        // Windows: netstat y taskkill
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        try {
          const { stdout } = await execPromise('netstat -ano | findstr :27017');
          if (stdout) {
            this.logger.warn('⚠️  Puerto 27017 ocupado');
            // Extraer PIDs y matar procesos
            const lines = stdout.split('\n');
            for (const line of lines) {
              const match = line.match(/LISTENING\s+(\d+)/);
              if (match) {
                const pid = match[1];
                this.logger.log(`🔨 Matando proceso en puerto 27017 (PID: ${pid})`);
                try {
                  await execPromise(`taskkill /PID ${pid} /F`);
                  this.logger.log('✅ Proceso terminado');
                  await this.delay(2000); // Esperar a que el puerto se libere
                } catch (killError) {
                  this.logger.warn(`⚠️  No se pudo matar proceso ${pid}`);
                }
              }
            }
          } else {
            this.logger.log('✅ Puerto 27017 libre');
          }
        } catch (error) {
          // Puerto libre (netstat no encontró nada)
          this.logger.log('✅ Puerto 27017 libre');
        }

        // Verificar si está en rango reservado de Hyper-V/WSL
        await this.checkHyperVReservedPorts();
      }
    } catch (error) {
      this.logger.warn(`⚠️  Error verificando puerto: ${error.message}`);
    }
  }

  /**
   * Verifica si el puerto 27017 está reservado por Hyper-V/WSL
   */
  private async checkHyperVReservedPorts(): Promise<void> {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const { stdout } = await execPromise('netsh interface ipv4 show excludedportrange protocol=tcp');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        const match = line.match(/\s*(\d+)\s+(\d+)\s+\*/);
        if (match) {
          const start = parseInt(match[1]);
          const end = parseInt(match[2]);
          
          if (27017 >= start && 27017 <= end) {
            this.logger.error(`❌ PUERTO 27017 RESERVADO POR HYPER-V (rango ${start}-${end})`);
            this.logger.error('');
            this.logger.error('📝 SOLUCIÓN: Ejecuta PowerShell como ADMINISTRADOR y ejecuta:');
            this.logger.error('   1. net stop winnat');
            this.logger.error('   2. netsh int ipv4 add excludedportrange protocol=tcp startport=27017 numberofports=1');
            this.logger.error('   3. net start winnat');
            this.logger.error('');
            this.logger.error('O TEMPORALMENTE ejecuta Backend como Administrador');
            throw new Error('Puerto 27017 reservado por Hyper-V');
          }
        }
      }
      
      this.logger.log('✅ Puerto 27017 NO está reservado por Hyper-V');
    } catch (error) {
      if (error.message === 'Puerto 27017 reservado por Hyper-V') {
        throw error;
      }
      // Si falla el comando netsh, continuar (puede no tener permisos)
      this.logger.warn('⚠️  No se pudo verificar puertos reservados (ejecutar como Admin para verificar)');
    }
  }

  /**
   * Asegura que el directorio de datos de MongoDB existe
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      this.logger.log('🔍 Verificando directorio de datos...');
      const platform = os.platform();
      let dataPath: string;

      if (platform === 'win32') {
        dataPath = path.join(process.cwd(), '..', 'data', 'db');
      } else {
        dataPath = '/data/db';
      }

      if (!fs.existsSync(dataPath)) {
        this.logger.log(`📁 Creando directorio: ${dataPath}`);
        fs.mkdirSync(dataPath, { recursive: true });
        this.logger.log('✅ Directorio creado');
      } else {
        this.logger.log('✅ Directorio de datos existe');
      }
    } catch (error) {
      this.logger.warn(`⚠️  Error con directorio de datos: ${error.message}`);
    }
  }

  /**
   * Limpia archivos de lock de MongoDB
   */
  private async cleanMongoLocks(): Promise<void> {
    try {
      this.logger.log('🔍 Verificando locks de MongoDB...');
      const platform = os.platform();
      let lockPaths: string[] = [];

      if (platform === 'win32') {
        lockPaths = [
          path.join(process.cwd(), '..', 'data', 'db', 'mongod.lock'),
          'C:\\data\\db\\mongod.lock',
        ];
      } else {
        lockPaths = ['/data/db/mongod.lock'];
      }

      let lockFound = false;
      for (const lockPath of lockPaths) {
        if (fs.existsSync(lockPath)) {
          this.logger.log(`🔨 Eliminando lock: ${lockPath}`);
          fs.unlinkSync(lockPath);
          lockFound = true;
        }
      }

      if (lockFound) {
        this.logger.log('✅ Locks limpiados');
      } else {
        this.logger.log('✅ No hay locks que limpiar');
      }
    } catch (error) {
      this.logger.warn(`⚠️  Error limpiando locks: ${error.message}`);
    }
  }

  /**
   * Prueba la conexión a MongoDB
   * @param mongoUri URI de conexión a MongoDB
   */
  private async testMongoConnection(mongoUri: string): Promise<void> {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: false,
    });

    // Cerrar la conexión de prueba
    await connection.disconnect();
  }

  /**
   * Intenta iniciar el servicio MongoDB en el sistema
   */
  private async tryStartMongoDB(): Promise<void> {
    try {
      const platform = os.platform();

      if (platform === 'win32') {
        await this.startMongoDBWindows();
      } else if (platform === 'darwin') {
        await this.startMongoDBMac();
      } else if (platform === 'linux') {
        await this.startMongoDBLinux();
      }

      this.logger.log('✅ Servicio MongoDB iniciado correctamente');
      // Esperar hasta que MongoDB esté listo (máximo 30 segundos)
      await this.waitForMongoDBReady(30);
    } catch (error) {
      this.logger.warn(
        `⚠️  No se pudo iniciar MongoDB automáticamente: ${error.message}`,
      );
      this.logger.log('💡 Asegúrese de que MongoDB está instalado y disponible en el PATH');
    }
  }

  /**
   * Espera hasta que MongoDB esté listo para aceptar conexiones
   * @param maxWaitSeconds Segundos máximos a esperar
   */
  private async waitForMongoDBReady(maxWaitSeconds: number): Promise<void> {
    this.logger.log(`⏱️  Esperando hasta ${maxWaitSeconds}s a que MongoDB esté listo...`);
    const startTime = Date.now();
    const maxWaitMs = maxWaitSeconds * 1000;
    let attempts = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attempts++;
      try {
        // Intentar conexión rápida
        const mongoose = require('mongoose');
        const connection = await mongoose.connect(
          this.configService.get<string>(
            'MONGODB_URI',
            'mongodb://localhost:27017/shieldtrack',
          ),
          {
            serverSelectionTimeoutMS: 1000,
            connectTimeoutMS: 1000,
          },
        );
        await connection.disconnect();
        this.logger.log(`✅ MongoDB listo después de ${attempts} verificaciones`);
        return;
      } catch (error) {
        // Esperar 1 segundo antes del próximo intento
        await this.delay(1000);
      }
    }

    this.logger.warn(`⏱️  MongoDB no respondió después de ${maxWaitSeconds}s`);
  }

  /**
   * Inicia MongoDB en Windows
   */
  private async startMongoDBWindows(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      
      // PRIMERO: Intentar iniciar servicio de Windows si existe
      this.logger.log('🔍 Verificando servicio MongoDB de Windows...');
      exec('sc query MongoDB', (queryError: Error, queryStdout: string) => {
        if (!queryError && queryStdout.includes('MongoDB')) {
          // Servicio existe, intentar iniciarlo
          this.logger.log('✅ Servicio MongoDB encontrado, iniciando...');
          exec('net start MongoDB', (startError: Error, startStdout: string) => {
            if (!startError || startStdout.includes('ya se ha iniciado')) {
              this.logger.log('✅ Servicio MongoDB iniciado/corriendo');
              resolve();
            } else {
              this.logger.warn('⚠️  Error iniciando servicio, intentando modo manual...');
              this.startMongoDBManual().then(resolve).catch(reject);
            }
          });
        } else {
          // Servicio no existe, modo manual
          this.logger.log('📝 Servicio no instalado, usando modo manual');
          this.startMongoDBManual().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Inicia MongoDB manualmente (sin servicio)
   */
  private async startMongoDBManual(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      
      // Buscar mongod en ubicaciones comunes
      const possiblePaths = [
        'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
        'C:\\Program Files (x86)\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
        'C:\\Program Files (x86)\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
      ];

      let mongodPath = null;
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          mongodPath = p;
          this.logger.log(`✅ MongoDB encontrado: ${p}`);
          break;
        }
      }

      if (!mongodPath) {
        this.logger.error('❌ MongoDB no encontrado');
        this.logger.error('');
        this.logger.error('📝 SOLUCIÓN: Instala MongoDB como servicio ejecutando:');
        this.logger.error('   .\\install-mongodb-service.ps1');
        this.logger.error('');
        reject(new Error('MongoDB no encontrado'));
        return;
      }

      const dataPath = path.join(process.cwd(), '..', 'data', 'db');
      
      this.logger.log(`🚀 Ejecutando: ${mongodPath} --dbpath "${dataPath}"`);

      // Intentar iniciar con START para que corra en ventana separada
      const command = `start "MongoDB" "${mongodPath}" --dbpath "${dataPath}" --bind_ip 127.0.0.1`;
      
      exec(command, (error: Error) => {
        if (error) {
          this.logger.warn(`⚠️  Error iniciando MongoDB sin admin: ${error.message}`);
          
          // PLAN B: Ejecutar script PowerShell con privilegios de admin
          this.logger.log('🔄 Intentando con privilegios de Administrador...');
          const scriptPath = path.join(process.cwd(), '..', 'start-mongo-admin.ps1');
          
          if (fs.existsSync(scriptPath)) {
            const adminCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
            exec(adminCommand, (adminError: Error) => {
              if (adminError) {
                this.logger.error('❌ Error ejecutando script de admin');
                this.logger.error('');
                this.logger.error('📝 SOLUCIÓN DEFINITIVA: Instala como servicio:');
                this.logger.error('   .\\install-mongodb-service.ps1');
                this.logger.error('');
                reject(adminError);
              } else {
                this.logger.log('✅ Script de administrador ejecutado');
                resolve();
              }
            });
          } else {
            this.logger.error('❌ No se pudo iniciar MongoDB');
            this.logger.error('');
            this.logger.error('📝 SOLUCIÓN: Instala MongoDB como servicio:');
            this.logger.error('   .\\install-mongodb-service.ps1');
            this.logger.error('');
            reject(error);
          }
        } else {
          this.logger.log('✅ MongoDB iniciado sin necesidad de admin');
          resolve();
        }
      });

      // Dar tiempo a que inicie
      setTimeout(() => resolve(), 3000);
    });
  }

  /**
   * Inicia MongoDB en macOS (usando Homebrew)
   */
  private async startMongoDBMac(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(
        'brew services start mongodb-community',
        (error) => {
          if (!error) {
            this.logger.log('✅ MongoDB iniciado en macOS con Homebrew');
            resolve();
          } else {
            // Intentar iniciar mongod directamente
            const mongodProcess = spawn('mongod', {
              detached: true,
              stdio: 'ignore',
            });

            if (mongodProcess.pid) {
              this.logger.log('✅ MongoDB iniciado como proceso directo en macOS');
              mongodProcess.unref();
              resolve();
            } else {
              reject(new Error('No se pudo iniciar MongoDB en macOS'));
            }
          }
        },
      );

      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  /**
   * Inicia MongoDB en Linux
   */
  private async startMongoDBLinux(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Intentar iniciar con systemctl primero
      exec('sudo systemctl start mongod', (error) => {
        if (!error) {
          this.logger.log('✅ MongoDB iniciado en Linux con systemctl');
          resolve();
          return;
        }

        // Si falla, intentar con systemctl para mongodb
        exec('sudo systemctl start mongodb', (error2) => {
          if (!error2) {
            this.logger.log('✅ MongoDB iniciado en Linux con systemctl (mongodb)');
            resolve();
            return;
          }

          // Último intento: mongod directo
          const mongodProcess = spawn('mongod', {
            detached: true,
            stdio: 'ignore',
          });

          if (mongodProcess.pid) {
            this.logger.log('✅ MongoDB iniciado como proceso directo en Linux');
            mongodProcess.unref();
            resolve();
          } else {
            reject(new Error('No se pudo iniciar MongoDB en Linux'));
          }
        });
      });

      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  /**
   * Calcula el delay con backoff exponencial jittered
   * @param attemptNumber Número de intento
   * @returns Delay en milisegundos
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    // Backoff exponencial: 2^attemptNumber, pero con límites
    const exponentialDelay = Math.min(
      this.initialDelay * Math.pow(2, attemptNumber - 1),
      this.maxDelay,
    );

    // Agregar jitter (variabilidad aleatoria) para evitar "thundering herd"
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  /**
   * Espera un número de milisegundos
   * @param ms Milisegundos a esperar
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  getConnectionStatus(): {
    isConnected: boolean;
    attempts: number;
    maxAttempts: number;
  } {
    return {
      isConnected: this.isMongoRunning,
      attempts: this.connectionAttempts,
      maxAttempts: this.maxConnectionAttempts,
    };
  }
}

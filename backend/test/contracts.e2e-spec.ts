import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuthController } from "../src/modules/auth/auth.controller";
import { SystemConfigController } from "../src/modules/system-config/system-config.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { UserAreaService } from "../src/modules/auth/user-area.service";
import { UserAssignmentService } from "../src/modules/auth/user-assignment.service";
import { SystemConfigService } from "../src/modules/system-config/system-config.service";
import { JwtAuthGuard } from "../src/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../src/modules/auth/guards/roles.guard";

describe("Contratos criticos API (e2e)", () => {
  let app: INestApplication;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    setupMfa: jest.fn(),
    enableMfa: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    reactivateUser: jest.fn(),
    switchTenant: jest.fn(),
  };

  const userAreaServiceMock = {
    replaceUserAreas: jest.fn().mockResolvedValue([]),
    assignArea: jest.fn(),
    removeArea: jest.fn(),
    getUserAreas: jest.fn(),
    getAreaUsers: jest.fn(),
  };

  const userAssignmentServiceMock = {
    updateAssignments: jest.fn().mockResolvedValue({ success: true }),
    getAssignments: jest.fn(),
  };

  const systemConfigServiceMock = {
    resetDatabase: jest.fn(),
    getSmtpConfigMasked: jest.fn(),
    updateSmtpConfig: jest.fn().mockResolvedValue({ ok: true }),
    testSmtpConnection: jest.fn(),
    getBrandingConfig: jest.fn(),
    updateBrandingConfig: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, SystemConfigController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserAreaService, useValue: userAreaServiceMock },
        { provide: UserAssignmentService, useValue: userAssignmentServiceMock },
        { provide: SystemConfigService, useValue: systemConfigServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();

    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      (req as { user: Record<string, string> }).user = {
        userId: "67f9a59a5d2e4d36a6ab8a11",
        id: "owner",
        role: "OWNER",
      };
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rechaza areaIds invalidos en asignacion masiva", async () => {
    await request(app.getHttpServer())
      .post("/auth/users/67f9a59a5d2e4d36a6ab8a11/areas/bulk")
      .send({ areaIds: ["no-es-objectid"] })
      .expect(400);
  });

  it("rechaza payload SMTP con correo invalido", async () => {
    await request(app.getHttpServer())
      .put("/system-config/smtp")
      .send({
        smtp_host: "smtp.example.com",
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: "user",
        smtp_pass: "secret",
        smtp_from_email: "correo-invalido",
        smtp_from_name: "ShieldTrack",
      })
      .expect(400);
  });
});

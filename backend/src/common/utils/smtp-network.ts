import { resolve4 } from "dns/promises";
import * as net from "net";

export interface ResolvedSmtpHost {
  connectionHost: string;
  tlsServername?: string;
  resolvedToIpv4: boolean;
}

/**
 * Resuelve un hostname SMTP a IPv4 para evitar errores ENETUNREACH en entornos
 * sin salida IPv6. Cuando se usa una IP para conectar, se conserva servername
 * para que TLS valide el certificado contra el hostname original.
 */
export async function resolveSmtpHostToIpv4(
  host: string,
): Promise<ResolvedSmtpHost> {
  const normalizedHost = (host || "").trim();

  if (!normalizedHost) {
    return {
      connectionHost: host,
      resolvedToIpv4: false,
    };
  }

  // Si ya es IP (v4 o v6), respetar valor configurado por el usuario.
  if (net.isIP(normalizedHost) !== 0) {
    return {
      connectionHost: normalizedHost,
      resolvedToIpv4: false,
    };
  }

  try {
    const ipv4Addresses = await resolve4(normalizedHost);
    if (ipv4Addresses.length > 0) {
      return {
        connectionHost: ipv4Addresses[0],
        tlsServername: normalizedHost,
        resolvedToIpv4: true,
      };
    }
  } catch {
    // Si no hay A record o falla DNS, se usa el hostname original.
  }

  return {
    connectionHost: normalizedHost,
    resolvedToIpv4: false,
  };
}

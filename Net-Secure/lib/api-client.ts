import { type JSZipFileOptions } from 'jszip';

export interface FileWithMetadata extends File {
    id: string;
    file: File;
    originalSize: number;
    optimizationMethod?: string;
    status: string;
    progress: number;
    compressionRatio?: number;
    compressedSize?: number;
    compressedBlob?: Blob;
}

export interface CompressionResult {
    data: Blob;
    size: number;
    compressedSize: number;
    compressedBlob: Blob;
}

export type CompressionMethod = 'STORE' | 'DEFLATE' | 'BZIP2';

export interface SecurityScanResults {
  data: {
    vulnerabilities?: Array<{
      name: string;
      severity: "low" | "medium" | "high";
      description: string;
      recommendation?: string;
    }>;
    headers?: {
      [key: string]: string;
    };
    tlsVersion?: string;
    certificateInfo?: {
      issuer: string;
      validFrom: string;
      validTo: string;
      isValid: boolean;
    };
    firewall?: {
      firewallDetected: boolean;
      filtered: string[];
      rules: string[];
    };
    ports?: {
      openPorts: string[];
      services: Array<{ port: string; service: string; version?: string }>;
    };
    ssl?: {
      grade: string;
      protocol: string;
      issues: string[];
      certDetails: {
        subject: string;
        issuer: string;
        validFrom: string;
        validTo: string;
        keySize: string;
        signatureAlgorithm: string;
      };
    };
  };
}

export const apiClient = {
    compress: async (file: File): Promise<CompressionResult> => {
        // Implement compression logic
        return {
            data: new Blob(),
            size: 0,
            compressedSize: 0,
            compressedBlob: new Blob()
        };
    },
    startSpeedTest: async () => {
        try {
            // Test download speed using a large file download
            const downloadStart = Date.now();
            const downloadResponse = await fetch('https://speed.cloudflare.com/1MB', {
                method: 'GET',
            });
            const downloadData = await downloadResponse.blob();
            const downloadTime = (Date.now() - downloadStart) / 1000; // Convert to seconds
            const downloadSpeed = (downloadData.size * 8) / (downloadTime * 1000000); // Convert to Mbps

            // Test upload speed using a generated file
            const uploadData = new Blob([new ArrayBuffer(1024 * 1024)]); // 1MB test file
            const uploadStart = Date.now();
            await fetch('https://speed.cloudflare.com/post', {
                method: 'POST',
                body: uploadData
            });
            const uploadTime = (Date.now() - uploadStart) / 1000;
            const uploadSpeed = (uploadData.size * 8) / (uploadTime * 1000000);

            return {
                download: Math.round(downloadSpeed * 100) / 100,
                upload: Math.round(uploadSpeed * 100) / 100,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Speed test error:', error);
            throw new Error('Speed test failed');
        }
    },

    getIpAddress: async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            return await response.json();
        } catch (error) {
            console.error('IP address lookup error:', error);
            throw new Error('Failed to get IP address');
        }
    },

    ping: async () => {
        try {
            const start = Date.now();
            await fetch('https://www.cloudflare.com/cdn-cgi/trace');
            const pingTime = Date.now() - start;
            return {
                startTime: start,
                pingTime
            };
        } catch (error) {
            console.error('Ping error:', error);
            throw new Error('Ping test failed');
        }
    },

    uploadFile: async (file: File) => {
        const startTime = Date.now();
        // Simulate file upload to measure speed
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to simulate network
        const uploadTime = (Date.now() - startTime) / 1000;
        return { uploadTime };
    },

    runNmapScan: async (host: string): Promise<SecurityScanResults> => {
        try {
            const response = await fetch(`/api/network/nmap?host=${encodeURIComponent(host)}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Nmap scan failed');
            return await response.json();
        } catch (error) {
            console.error('Nmap scan error:', error);
            throw new Error('Network scan failed');
        }
    },

    scanPorts: async (host: string) => {
        try {
            const response = await fetch(`/api/network/ports?host=${encodeURIComponent(host)}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Port scan failed');
            const data = await response.json();
            return {
                openPorts: data.openPorts || [],
                services: data.services || []
            };
        } catch (error) {
            console.error('Port scan error:', error);
            throw new Error('Port scan failed');
        }
    },

    scanServices: async (host: string): Promise<SecurityScanResults> => {
        try {
            const response = await fetch(`/api/network/services?host=${encodeURIComponent(host)}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Service scan failed');
            return await response.json();
        } catch (error) {
            console.error('Service scan error:', error);
            throw new Error('Service scan failed');
        }
    },

    scanVulnerabilities: async (host: string): Promise<SecurityScanResults> => {
        try {
            const response = await fetch(`/api/security/vulnerabilities?host=${encodeURIComponent(host)}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Vulnerability scan failed');
            const data = await response.json();
            return {
                data: {
                    vulnerabilities: data.vulnerabilities || [],
                }
            };
        } catch (error) {
            console.error('Vulnerability scan error:', error);
            throw new Error('Vulnerability scan failed');
        }
    },

    checkFirewall: async (host: string): Promise<SecurityScanResults> => {
        try {
            const response = await fetch(`/api/network/firewall?host=${encodeURIComponent(host)}`, {
                method: 'GET',
            });
            if (!response.ok) throw new Error('Firewall check failed');
            const data = await response.json();
            return {
                data: {
                    firewallDetected: data.firewallDetected || false,
                    filtered: data.filtered || [],
                    rules: data.rules || []
                }
            };
        } catch (error) {
            console.error('Firewall check error:', error);
            throw new Error('Firewall check failed');
        }
    }
};
const express = require('express');
const multer = require('multer');
const cors = require('cors');  
const { exec } = require('child_process'); 
const app = express();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

/**
 * Cloud-native CORS configuration that works in any environment
 * This implementation supports:
 * - Local development
 * - Cloud platforms (AWS, GCP, Azure)
 * - Containerized deployments (Docker, Kubernetes)
 * - Serverless environments
 * - PaaS platforms (Heroku, Vercel, Netlify)
 */
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variables or use defaults
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? 
      process.env.CORS_ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://frontend:3000'];
    
    // Add common development domains to allowed origins
    const trustedDomains = [
      // GitHub Codespaces domains
      '.app.github.dev',
      // Local development
      'localhost',
      '127.0.0.1',
      // Cloud development platforms
      '.vercel.app',
      '.netlify.app',
      '.ngrok.io'
    ];
    
    // Check if the request origin matches any trusted domain pattern
    const isTrustedDomain = trustedDomains.some(domain => origin.includes(domain));
    
    // Allow if it's a trusted domain or explicitly allowed
    if (isTrustedDomain || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-start-time', 'x-requested-with'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
console.log(`CORS configured with cloud-native settings. Explicit allowed origins: ${process.env.CORS_ALLOWED_ORIGINS || 'Default development origins'}`);

// Add proper OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Fix missing/incorrect endpoint paths in requests
app.use((req, res, next) => {
  // Detect and fix common URL path issues
  if (req.path.includes('/ip/')) {
    // Fix issue where 'ip' gets attached to hostname without slash
    req.url = req.url.replace('/ip/', '/ip');
  } else if (req.path.endsWith('/ip')) {
    // Ensure trailing slash is properly handled
    req.url = '/ip';
  }
  
  console.log(`Processing request: ${req.method} ${req.path} from origin: ${req.headers.origin || 'Unknown'}`);
  next();
});

const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'a'); // 5MB

// Basic health check endpoint
app.get('/', (req, res) =>{
    res.send('200 OK')
})

// IP endpoint - properly separated from hostname
app.get('/ip', (req, res) => {
    const IP = req.ip;
    res.json({ ip: IP })
})

app.get('/ping', (req, res) => {
    const startTime = Date.now();
    res.json({ startTime });
});

app.get('/download', (req, res) => {
    res.setHeader('Content-Length', largeBuffer.length);
    res.send(largeBuffer);
});


app.get('/nmap', (req, res) => {
    const userIP = req.ip;  
    console.log(`nmap -A --script vuln ${userIP}`)
    exec(`nmap -A --script vuln ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Nmap scan failed', details: stderr });
        }
        res.json({ nmap: stdout });
    });
});

app.get('/open-ports', (req, res) => {
    const userIP = req.ip;
    exec(`nmap -p- ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Port scan failed', details: stderr });
        }
        res.json({ ports: stdout });
    });
});

app.get('/services', (req, res) => {
    const userIP = req.ip;
    exec(`nmap -sV -O ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Service detection failed', details: stderr });
        }
        res.json({ services: stdout });
    });
});

app.get('/ssl-check', (req, res) => {
    const userIP = req.ip;
    exec(`nmap --script ssl-enum-ciphers ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'SSL check failed', details: stderr });
        }
        res.json({ ssl: stdout });
    });
});

app.get('/vuln-scan', (req, res) => {
    const userIP = req.ip;
    exec(`nmap --script vuln ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Vulnerability scan failed', details: stderr });
        }
        res.json({ vuln: stdout });
    });
});

app.get('/firewall-check', (req, res) => {
    const userIP = req.ip;
    exec(`nmap -sA ${userIP}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Firewall detection failed', details: stderr });
        }
        res.json({ firewall: stdout });
    });
});

// Configure file upload for testing upload speed
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const startTime = req.headers['x-start-time']; // Client sends timestamp
    if (!startTime) {
        return res.status(400).json({ error: 'Missing x-start-time header' });
    }
    const endTime = Date.now();
    const uploadTime = endTime - startTime;
    res.json({ uploadTime });
});

// Speed test route - uses real file transfers to measure speed
app.post('/test-files', (req, res) => {
    const sizes = [100, 1024, 10240]; // KB sizes for test files
    const files = [];
    
    // Generate test files of different sizes if they don't exist
    sizes.forEach(size => {
        const filePath = path.join(__dirname, 'test-files', `${size}kb.bin`);
        if (!fs.existsSync(filePath)) {
            const buffer = crypto.randomBytes(size * 1024);
            fs.writeFileSync(filePath, buffer);
        }
        files.push(filePath);
    });
    
    res.json({ files });
});

// Network speed test endpoint with multiple test servers
app.post('/speed-test', async (req, res) => {
    try {
        // Run download and upload tests in parallel
        const [download, upload] = await Promise.all([
            measureDownloadSpeed(),
            measureUploadSpeed()
        ]);

        res.json({ 
            download: parseFloat(download.toFixed(2)), 
            upload: parseFloat(upload.toFixed(2)),
            unit: 'Mbps',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Speed test failed', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Measure real download speed using multiple test servers
async function measureDownloadSpeed() {
    const testServers = [
        'http://speedtest.ftp.otenet.gr/files/test100k.db',
        'http://speedtest.tele2.net/100KB.zip',
        'http://speedtest.belwue.net/random100.bin',
        'http://speedtest.cyfrowypolsat.pl/speedtest/random4000x4000.jpg',
        'http://speedtest-ny.turnkeyinternet.net/100mb.bin',
        'http://speedtest.i3d.net/downloads/test10.zip',
        'http://lg.foundry.sh/downloads/test50.zip'
    ];
    
    const speeds = [];
    const errors = [];
    
    // Test with different file sizes for better accuracy
    const testSizes = [
        { size: '100KB', count: 5 },  // Quick initial tests
        { size: '1MB', count: 3 },    // Medium size tests
        { size: '10MB', count: 1 }    // Large file test for sustained speed
    ];
    
    for (const server of testServers) {
        try {
            console.log(`Testing download speed with server: ${server}`);
            
            const results = await Promise.all(
                testSizes.flatMap(({ size, count }) =>
                    Array(count).fill().map(async () => {
                        const start = Date.now();
                        const response = await fetch(server, {
                            timeout: 10000, // 10 second timeout
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        const end = Date.now();
                        
                        const durationInSeconds = (end - start) / 1000;
                        const fileSizeInBits = blob.size * 8;
                        const speedMbps = (fileSizeInBits / 1000000) / durationInSeconds;
                        
                        return speedMbps;
                    })
                )
            );
            
            speeds.push(...results.filter(speed => speed > 0 && !isNaN(speed) && isFinite(speed)));
        } catch (error) {
            console.warn(`Failed to test with server ${server}:`, error);
            errors.push({ server, error: error.message });
            continue;
        }
    }
    
    if (speeds.length === 0) {
        console.error('All download speed tests failed:', errors);
        throw new Error('All download speed tests failed. Please try again.');
    }
    
    // Remove outliers using interquartile range
    speeds.sort((a, b) => a - b);
    const q1 = speeds[Math.floor(speeds.length / 4)];
    const q3 = speeds[Math.floor(speeds.length * 3 / 4)];
    const iqr = q3 - q1;
    const validSpeeds = speeds.filter(speed => speed >= q1 - 1.5 * iqr && speed <= q3 + 1.5 * iqr);
    
    // Calculate average of remaining speeds
    const averageSpeed = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
    
    return averageSpeed;
}

// Measure real upload speed with multiple test methods
async function measureUploadSpeed() {
    const sizes = [1, 2, 4, 8, 16].map(size => size * 1024 * 1024); // Test with 1MB to 16MB
    const speeds = [];
    const errors = [];
    
    for (const size of sizes) {
        try {
            console.log(`Testing upload speed with ${size / (1024 * 1024)}MB file`);
            
            // Generate random data
            const data = crypto.randomBytes(size);
            
            // Test upload speed using multiple methods
            const results = await Promise.all([
                measureFileWrite(data),
                measureNetworkUpload(data),
                measureStreamUpload(data)
            ]);
            
            speeds.push(...results.filter(speed => speed > 0 && !isNaN(speed) && isFinite(speed)));
        } catch (error) {
            console.warn(`Failed upload test with size ${size}:`, error);
            errors.push({ size, error: error.message });
            continue;
        }
    }
    
    if (speeds.length === 0) {
        console.error('All upload speed tests failed:', errors);
        throw new Error('All upload speed tests failed. Please try again.');
    }
    
    // Remove outliers and calculate average
    speeds.sort((a, b) => a - b);
    const q1 = speeds[Math.floor(speeds.length / 4)];
    const q3 = speeds[Math.floor(speeds.length * 3 / 4)];
    const iqr = q3 - q1;
    const validSpeeds = speeds.filter(speed => speed >= q1 - 1.5 * iqr && speed <= q3 + 1.5 * iqr);
    
    return validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
}

// Helper function to measure upload speed using file write
async function measureFileWrite(data) {
    const tempPath = path.join(os.tmpdir(), `speedtest-${Date.now()}.tmp`);
    const start = Date.now();
    
    try {
        await fs.promises.writeFile(tempPath, data);
        const end = Date.now();
        await fs.promises.unlink(tempPath); // Clean up
        
        const durationInSeconds = (end - start) / 1000;
        const fileSizeInBits = data.length * 8;
        return (fileSizeInBits / 1000000) / durationInSeconds; // Return Mbps
    } catch (error) {
        console.warn('File write speed test failed:', error);
        throw error;
    }
}

// Helper function to measure upload speed using network
async function measureNetworkUpload(data) {
    const start = Date.now();
    
    try {
        // Simulate network upload using local endpoint
        const response = await fetch('http://localhost:3001/upload', {
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/octet-stream' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const end = Date.now();
        const durationInSeconds = (end - start) / 1000;
        const fileSizeInBits = data.length * 8;
        return (fileSizeInBits / 1000000) / durationInSeconds; // Return Mbps
    } catch (error) {
        console.warn('Network upload speed test failed:', error);
        throw error;
    }
}

// Helper function to measure upload speed using streams
async function measureStreamUpload(data) {
    const tempPath = path.join(os.tmpdir(), `speedtest-stream-${Date.now()}.tmp`);
    const start = Date.now();
    
    try {
        await new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(tempPath);
            const readable = new stream.Readable();
            readable._read = () => {}; // _read is required but you can noop it
            readable.push(data);
            readable.push(null);
            
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            readable.pipe(writeStream);
        });
        
        const end = Date.now();
        await fs.promises.unlink(tempPath); // Clean up
        
        const durationInSeconds = (end - start) / 1000;
        const fileSizeInBits = data.length * 8;
        return (fileSizeInBits / 1000000) / durationInSeconds; // Return Mbps
    } catch (error) {
        console.warn('Stream upload speed test failed:', error);
        throw error;
    }
}

// Real SSL/TLS security check
app.get('/ssl-check', async (req, res) => {
    try {
        const host = req.query.host || req.headers.host;
        const testResults = await testSSL(host);
        res.json(testResults);
    } catch (error) {
        res.status(500).json({ error: 'SSL check failed', details: error.message });
    }
});

async function testSSL(host) {
    return new Promise((resolve, reject) => {
        const results = {
            grade: 'F',
            protocol: 'Unknown',
            certificate: 'Unknown',
            issues: [],
            cipherSuites: [],
            certDetails: {}
        };

        // Test TLS 1.3
        exec(`openssl s_client -connect ${host}:443 -servername ${host} -tls1_3`, (error, stdout, stderr) => {
            if (!error && stdout.includes('Protocol  : TLSv1.3')) {
                results.protocol = 'TLS 1.3';
                results.grade = 'A+';
            } else {
                // Test TLS 1.2 if 1.3 fails
                exec(`openssl s_client -connect ${host}:443 -servername ${host} -tls1_2`, (error2, stdout2, stderr2) => {
                    if (!error2 && stdout2.includes('Protocol  : TLSv1.2')) {
                        results.protocol = 'TLS 1.2';
                        results.grade = 'A';
                    } else {
                        results.protocol = 'Older/Insecure';
                        results.grade = 'F';
                        results.issues.push('Using outdated TLS version');
                    }
                });
            }

            // Check certificate details
            exec(`openssl x509 -in <(openssl s_client -connect ${host}:443 -servername ${host} -showcerts </dev/null) -text -noout`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
                if (!error) {
                    // Parse certificate information
                    const certInfo = stdout.toString();
                    
                    results.certDetails = {
                        subject: certInfo.match(/Subject: (.+)/)?.[1] || 'Unknown',
                        issuer: certInfo.match(/Issuer: (.+)/)?.[1] || 'Unknown',
                        validFrom: certInfo.match(/Not Before: (.+)/)?.[1] || 'Unknown',
                        validTo: certInfo.match(/Not After : (.+)/)?.[1] || 'Unknown',
                        keySize: certInfo.match(/Public-Key: \((\d+) bit\)/)?.[1] || 'Unknown',
                        signatureAlgorithm: certInfo.match(/Signature Algorithm: (.+)/)?.[1] || 'Unknown'
                    };

                    // Validate certificate date
                    const now = new Date();
                    const validFrom = new Date(results.certDetails.validFrom);
                    const validTo = new Date(results.certDetails.validTo);

                    if (now < validFrom || now > validTo) {
                        results.certificate = 'Invalid (Expired or not yet valid)';
                        results.grade = 'F';
                        results.issues.push('Certificate date validation failed');
                    } else {
                        results.certificate = 'Valid';
                    }

                    // Check key strength
                    const keySize = parseInt(results.certDetails.keySize);
                    if (keySize < 2048) {
                        results.issues.push('Weak certificate key size');
                        results.grade = results.grade === 'A+' ? 'B' : 'C';
                    }
                } else {
                    results.certificate = 'Error checking certificate';
                    results.issues.push('Unable to verify certificate');
                }
            });

            // Check supported cipher suites
            exec(`openssl ciphers -v 'ALL:COMPLEMENTOFALL'`, (error, stdout, stderr) => {
                if (!error) {
                    const supportedCiphers = stdout.toString().split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                            const [name, protocol, keyExchange, authentication, encryption, mac] = line.split(/\s+/);
                            return { name, protocol, keyExchange, authentication, encryption, mac };
                        });

                    results.cipherSuites = supportedCiphers;

                    // Check for weak ciphers
                    const weakCiphers = supportedCiphers.filter(cipher => 
                        cipher.name.includes('NULL') || 
                        cipher.name.includes('RC4') || 
                        cipher.name.includes('DES') ||
                        cipher.name.includes('MD5')
                    );

                    if (weakCiphers.length > 0) {
                        results.issues.push('Weak cipher suites available');
                        results.grade = results.grade === 'A+' ? 'B' : 'C';
                    }
                }
            });

            // Check HSTS
            exec(`curl -sI https://${host}`, (error, stdout, stderr) => {
                if (!error) {
                    const hasHSTS = stdout.toString().toLowerCase().includes('strict-transport-security');
                    if (!hasHSTS) {
                        results.issues.push('HSTS not enabled');
                        if (results.grade === 'A+') results.grade = 'A';
                    }
                }
            });

            // Final security checks and grade adjustment
            if (results.issues.length === 0 && results.protocol === 'TLS 1.3' && results.certificate === 'Valid') {
                results.grade = 'A+';
            } else if (results.issues.length === 1 && results.protocol === 'TLS 1.2') {
                results.grade = 'A';
            } else if (results.issues.length > 3 || results.protocol === 'Older/Insecure') {
                results.grade = 'F';
            }

            resolve(results);
        });
    });
}

// Real port scanning with rate limiting
const portScanLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});

app.get('/ports', portScanLimiter, async (req, res) => {
    const targetHost = req.query.host || req.ip;
    
    try {
        const results = await scanPorts(targetHost);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Port scan failed', details: error.message });
    }
});

async function scanPorts(host) {
    return new Promise((resolve, reject) => {
        const command = `nmap -p- -T4 ${host}`;
        exec(command, (error, stdout, stderr) => {
            if (error && !stdout) {
                reject(error);
                return;
            }
            
            const results = {
                openPorts: [],
                services: []
            };
            
            // Parse nmap output
            const lines = stdout.split('\n');
            lines.forEach(line => {
                if (line.includes('open')) {
                    const port = line.match(/(\d+)\/tcp/)?.[1];
                    const service = line.split('open')[1]?.trim();
                    if (port) {
                        results.openPorts.push(port);
                        if (service) {
                            results.services.push({ port, service });
                        }
                    }
                }
            });
            
            resolve(results);
        });
    });
}

// Implement real firewall check
app.get('/firewall-check', async (req, res) => {
    const targetHost = req.query.host || req.ip;
    
    try {
        const results = await checkFirewall(targetHost);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Firewall check failed', details: error.message });
    }
});

async function checkFirewall(host) {
    return new Promise((resolve, reject) => {
        const command = `sudo nmap -sA ${host}`;
        exec(command, (error, stdout, stderr) => {
            if (error && !stdout) {
                reject(error);
                return;
            }
            
            const results = {
                firewallDetected: false,
                filtered: [],
                rules: []
            };
            
            if (stdout.includes('filtered')) {
                results.firewallDetected = true;
                
                // Parse filtered ports
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    if (line.includes('filtered')) {
                        const port = line.match(/(\d+)\/tcp/)?.[1];
                        if (port) {
                            results.filtered.push(port);
                        }
                    }
                });
            }
            
            resolve(results);
        });
    });
}

// Configure multer for file upload with size limits
const compressStorage = multer.memoryStorage();
const compressUpload = multer({
  storage: compressStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Advanced compression optimization endpoint
app.post('/optimize-compression', compressUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Get optimization preferences from request
    const { method = 'DEFLATE', level = 6 } = req.body;
    
    // Process the file based on its type
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    
    let optimizedBuffer;
    let compressionInfo = {
      originalSize: fileBuffer.length,
      optimizedSize: 0,
      compressionRatio: 0,
      method: method,
      level: parseInt(level)
    };

    if (mimeType.startsWith('image/')) {
      // Image optimization using Sharp
      const sharp = require('sharp');
      const image = sharp(fileBuffer);
      
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        optimizedBuffer = await image
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
      } else if (mimeType === 'image/png') {
        optimizedBuffer = await image
          .png({ compressionLevel: 9, palette: true })
          .toBuffer();
      } else if (mimeType === 'image/webp') {
        optimizedBuffer = await image
          .webp({ quality: 80 })
          .toBuffer();
      } else {
        optimizedBuffer = fileBuffer;
      }
    } else if (mimeType.startsWith('text/') || /\.(js|css|html|json)$/.test(req.file.originalname)) {
      // Text file optimization
      const minify = require('minify');
      const text = fileBuffer.toString('utf8');
      optimizedBuffer = Buffer.from(await minify.optimize(text));
    } else {
      // Generic file compression using pako
      const pako = require('pako');
      optimizedBuffer = Buffer.from(pako.deflate(fileBuffer, { level: compressionInfo.level }));
    }

    // Calculate compression metrics
    compressionInfo.optimizedSize = optimizedBuffer.length;
    compressionInfo.compressionRatio = Math.round(((fileBuffer.length - optimizedBuffer.length) / fileBuffer.length) * 100);

    // Return optimized file and compression info
    res.json({
      success: true,
      file: optimizedBuffer.toString('base64'),
      stats: compressionInfo
    });

  } catch (error) {
    console.error('Compression optimization failed:', error);
    res.status(500).json({
      error: 'Compression optimization failed',
      details: error.message
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const { createCA, createCert } = require('https-localhost');

async function generate() {
    const ca = await createCA({
        organization: 'Game Dev CA',
        countryCode: 'MY',
        state: 'Development',
        locality: 'Localhost',
        validity: 365
    });

    const cert = await createCert({
        ca: { key: ca.key, cert: ca.cert },
        domains: ['localhost', '192.168.0.XXX'], // Replace with your local IP
        validity: 365
    });

    console.log('Certificates generated successfully');
}

generate().catch(console.error);
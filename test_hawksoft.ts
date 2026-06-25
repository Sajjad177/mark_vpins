import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const hawksoftClientId = process.env.HAWKSOFT_CLIENT_ID;
const hawksoftClientSecret = process.env.HAWKSOFT_CLIENT_SECRET;
const baseUrl = process.env.HAWKSOFT_API_URL;
const version = process.env.HAWKSOFT_API_VERSION;
const agencyId = 17837;

const getAuthHeader = () => {
    const credentials = `${hawksoftClientId}:${hawksoftClientSecret}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
};

async function test() {
    try {
        console.log('Testing agency:', agencyId);
        const response = await axios.get(`${baseUrl}/vendor/agency/${agencyId}/clients`, {
            params: { version, limit: 5 },
            headers: { Authorization: getAuthHeader() },
        });
        console.log('Success! Client IDs:', response.data);
    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();

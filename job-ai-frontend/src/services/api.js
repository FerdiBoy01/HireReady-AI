import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const checkJobMatch = async (userId, jobDescription) => {
    try {
        const response = await axios.post(`${API_URL}/analyze-match`, {
            userId,
            jobDescription
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
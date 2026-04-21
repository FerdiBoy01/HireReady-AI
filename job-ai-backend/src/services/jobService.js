const axios = require('axios');
require('dotenv').config();

// Kita ganti default location menjadi 'sg' (Singapura) atau 'us' (Amerika)
const fetchJobs = async (keyword, location = 'sg') => {
    const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;
    
    // Mengubah spasi menjadi format yang aman untuk URL (misal: "web developer" jadi "web%20developer")
    const safeKeyword = encodeURIComponent(keyword);

    // URL Adzuna menggunakan negara yang didukung
    const url = `https://api.adzuna.com/v1/api/jobs/${location}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=12&what=${safeKeyword}`;

    try {
        const response = await axios.get(url);
        
        return response.data.results.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description, 
            redirect_url: job.redirect_url,
            created: job.created
        }));
    } catch (error) {
        console.error("🔥 Error fetching jobs from Adzuna:", error.message);
        return []; 
    }
};

module.exports = { fetchJobs };
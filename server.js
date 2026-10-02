const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Pulls passwords securely from Render so they aren't public
const uri = process.env.MONGODB_URI; 
const dbName = process.env.MONGODB_DB_NAME;

const client = new MongoClient(uri);

app.get('/api/job-stats', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbName); 
        const collection = database.collection('job');

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const pipeline = [
            {
                $match: {
                    "company": { $in: ["VyTalent Solutions", "Imperial Supplies", "Champion Window and Home Exteriors", "Hillwood", "DATTCO"] },
                    $or: [
                        { "isActive": true, "status": "posted", "datePosted": { $gte: today } },
                        { "isActive": false, "status": "removed", "updatedAt": { $gte: today } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$company",
                    totalActiveJobs: { $sum: {$cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
                    totalRemovedJobs: { $sum: {$cond: [{ $eq: ["$isActive", false] }, 1, 0] } }
                }
            },
            {
                $sort: { totalActiveJobs: -1, totalRemovedJobs: -1 }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        res.json({ success: true, data: results });

    } catch (error) {
        console.error("Query failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});

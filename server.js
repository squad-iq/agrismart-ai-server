app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        imageData = imageData.replace(/^data:image\/\w+;base64,/, "");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: imageData
                                    }
                                },
                                {
                                    text: "describe image"
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

        return res.json(data);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

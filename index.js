import express from 'express';
import multer from 'multer';
import cors from 'cors';
import vision from '@google-cloud/vision';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 4000;
const upload = multer({ dest: 'uploads/' });

const client = new vision.ImageAnnotatorClient({
  keyFilename: './service-account.json'
});

app.use(cors());

const categoryMap = {
  'sofa': 'Sofa (3-seat)',
  'loveseat': 'Loveseat (2-seat)',
  'sectional': 'Sectional Sofa (Per Section)',
  'recliner': 'Recliner Chair',
  'bench': 'Entry Bench',
  'ottoman': 'Small Ottoman',
  'chair': 'Armchair',
  'tufted': 'Camelback / Rolled-arm Chair',
  'cushion': 'Seat Cushion (Boxed)',
  'pillow': 'Throw Pillow'
};

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const [result] = await client.labelDetection(req.file.path);
    const labels = result.labelAnnotations.map(label => label.description.toLowerCase());

    const match = labels.find(label =>
      Object.keys(categoryMap).some(key => label.includes(key))
    );

    const category = match
      ? categoryMap[Object.keys(categoryMap).find(k => match.includes(k))]
      : null;

    fs.unlinkSync(req.file.path); // remove temp file

    res.json({ category: category || 'Unrecognized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vision API failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

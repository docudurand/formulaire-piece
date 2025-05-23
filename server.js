const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  "https://348b238c-180f-4111-994a-5cd53d6e50db.filesusr.com",
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed from this origin"));
    }
  }
}));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/send", upload.array("files"), async (req, res) => {
  const { email, brand, supplier, reference, designation, price, discount } = req.body;
  const files = req.files;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const attachments = (req.files || []).map(file => ({
    filename: file.originalname,
    content: file.buffer
  }));

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <h2 style="color: #1e90ff;">🧾 Nouvelle demande de réapprovisionnement</h2>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ccc;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Email</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Marque</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${brand}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Fournisseur</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${supplier}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Référence</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${reference}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Désignation (si en anglais)</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${designation}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Tarif</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${price}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #eee;"><strong>Remise</strong></td>
            <td style="padding: 10px; border: 1px solid #eee;">${discount}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 0.9em; color: #888;">📎 ${files.length} pièce(s) jointe(s) incluse(s)</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Formulaire création" <${process.env.EMAIL_USER}>`,
      to: process.env.DEST_EMAIL,
      subject: "Nouveau formulaire de création",
      html: htmlMessage,
       attachments
    });

    res.status(200).send("Formulaire envoyé avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail :", error);
    res.status(500).send("Erreur lors de l'envoi du formulaire.");
  }
});

app.listen(port, () => {
  console.log(`Serveur en ligne sur le port ${port}`);
});

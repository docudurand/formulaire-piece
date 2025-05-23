const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Autoriser les requêtes CORS (depuis Wix ou tout domaine)
app.use(cors({
  origin: 'https://348b238c-180f-4111-994a-5cd53d6e50db.filesusr.com',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer : stocker temporairement tous types de fichiers sauf .exe, .sh, etc.
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const forbidden = /\.(exe|bat|sh|cmd|js)$/i;
    if (forbidden.test(file.originalname)) {
      return cb(new Error("Type de fichier non autorisé."), false);
    }
    cb(null, true);
  }
});

// Transport SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Génère un tableau HTML stylé
function generateHtml(data) {
  const rows = Object.entries(data).map(([label, value]) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">
        ${label.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase())}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd;">
        ${value || '<em>(vide)</em>'}
      </td>
    </tr>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto;">
      <h2 style="text-align:center; color: #007bff;">📩 Nouveau formulaire reçu</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        ${rows}
      </table>
      <p style="margin-top: 20px;">📎 Des fichiers sont joints à ce message si fournis dans le formulaire.</p>
    </div>
  `;
}

// Route de réception du formulaire
app.post("/submit-form", upload.array("fichiers[]"), async (req, res) => {
  const formData = req.body;
  const attachments = req.files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  const mailOptions = {
    from: `"Formulaire création" <${process.env.EMAIL_USER}>`,
    to: process.env.DEST_EMAIL,
    subject: "🧾Nouveau formulaire de création",
    html: generateHtml(formData),
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);

    // Supprimer les fichiers temporaires
    req.files.forEach(file => fs.unlink(file.path, () => {}));

    res.status(200).send("Formulaire envoyé !");
  } catch (error) {
    console.error("Erreur d'envoi :", error);
    res.status(500).send("Erreur serveur.");
  }
});

app.get("/", (req, res) => {
  res.send("✅ Serveur opérationnel !");
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

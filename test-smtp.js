// Script para testar configuração SMTP
const nodemailer = require("nodemailer");

// Configurações SMTP
const smtpConfig = {
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "contato@smartgabinete.com.br",
    pass: "Wfbmprt8@",
  },
};

console.log("🔍 Testando configuração SMTP...");
console.log("📧 Email:", smtpConfig.auth.user);
console.log(
  "🔑 Senha:",
  smtpConfig.auth.pass ? "***configurada***" : "❌ NÃO CONFIGURADA"
);
console.log("🌐 Host:", smtpConfig.host);
console.log("🚪 Porta:", smtpConfig.port);
console.log("🔒 SSL:", smtpConfig.secure);
console.log("");

// Criar transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Testar conexão
async function testConnection() {
  try {
    console.log("🔄 Testando conexão SMTP...");

    // Verificar conexão
    const verifyResult = await transporter.verify();
    console.log("✅ Conexão SMTP verificada com sucesso!");
    console.log("📋 Resultado:", verifyResult);

    // Testar envio de e-mail
    console.log("\n📤 Testando envio de e-mail...");

    const testEmail = {
      from: `"Smart Gabinete" <${smtpConfig.auth.user}>`,
      to: "teste@example.com",
      subject: "Teste de Configuração SMTP",
      text: "Este é um e-mail de teste para verificar a configuração SMTP.",
      html: "<h1>Teste de Configuração SMTP</h1><p>Este é um e-mail de teste para verificar a configuração SMTP.</p>",
    };

    const sendResult = await transporter.sendMail(testEmail);
    console.log("✅ E-mail de teste enviado com sucesso!");
    console.log("📧 Message ID:", sendResult.messageId);
  } catch (error) {
    console.error("❌ Erro na configuração SMTP:");
    console.error("📋 Código:", error.code);
    console.error("📝 Mensagem:", error.message);
    console.error("🔍 Resposta:", error.response);
    console.error("⚡ Comando:", error.command);

    // Sugestões de solução
    console.log("\n💡 Sugestões de solução:");

    if (error.code === "EAUTH") {
      console.log("🔑 Verifique suas credenciais SMTP:");
      console.log("   - Email e senha estão corretos?");
      console.log(
        "   - A senha é a senha de aplicativo (não a senha da conta)?"
      );
      console.log("   - O e-mail está ativo no Hostinger?");
    }

    if (error.code === "ECONNECTION") {
      console.log("🌐 Problema de conexão:");
      console.log("   - Verifique se o host e porta estão corretos");
      console.log("   - Verifique se o firewall não está bloqueando");
    }

    if (error.code === "ETIMEDOUT") {
      console.log("⏰ Timeout de conexão:");
      console.log("   - Verifique sua conexão com a internet");
      console.log("   - Tente novamente em alguns minutos");
    }

    console.log("\n📋 Configurações recomendadas para Hostinger:");
    console.log("   - Host: smtp.hostinger.com");
    console.log("   - Porta: 465");
    console.log("   - SSL: true");
    console.log("   - Use senha de aplicativo, não senha da conta");
  }
}

// Executar teste
testConnection();

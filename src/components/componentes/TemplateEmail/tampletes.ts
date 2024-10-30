export const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Gabinete - E-mail de Apresentação</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 20px;
      text-align: center;
      border-bottom: 4px solid #0057b8; /* Linha em destaque na cor do tema */
    }
    .header img {
      max-width: 200px;
    }
    .banner {
      position: relative;
      text-align: center;
      color: white;
    }
    .banner img {
      width: 100%;
      max-width: 600px;
      height: auto;
    }
    .banner-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.6);
      padding: 10px 20px;
      border-radius: 8px;
    }
    .content {
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .content h2 {
      color: #0057b8;
      font-size: 22px;
    }
    .cta-button {
      display: inline-block;
      background-color: #0057b8;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px 0;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .feature {
      width: 48%;
      margin-bottom: 20px;
    }
    .feature h3 {
      color: #0057b8;
      font-size: 18px;
    }
    .footer {
      background-color: #f4f4f4;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #777;
    }
    .footer a {
      color: #0057b8;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

<div class="container">
  
  <!-- Cabeçalho com o Logo -->
  <div class="header">
    <img src="https://www.smartgabinete.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo500x150.00132659.png&w=640&q=75" alt="Smart Gabinete Logo"> <!-- Logo azul -->
  </div>

  <!-- Banner Principal -->
  <div class="banner">
    <img src="https://www.smartgabinete.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FambienteSmartGabinete.d1052391.png&w=828&q=75" alt="Interface do Smart Gabinete">
    <div class="banner-text">
      <h2>Simplifique sua gestão, aumente sua produtividade</h2>
      <p>Experimente o Smart Gabinete com um teste gratuito de 30 dias!</p>
    </div>
  </div>

  <!-- Conteúdo Principal -->
  <div class="content">
    <h2>Descubra os Benefícios do Smart Gabinete</h2>
    <p>Assista a nossa <a href="https://www.smartgabinete.com.br/apresentacao.mp4" target="_blank">apresentação em vídeo</a> e veja como o Smart Gabinete pode transformar sua gestão de maneira prática e eficiente.</p>

    <!-- Recursos -->
    <div class="features">
      <div class="feature">
        <h3>Gestão Centralizada</h3>
        <p>Todos os dados em um só lugar. Acesse informações rapidamente e tome decisões com mais segurança.</p>
      </div>
      <div class="feature">
        <h3>Relatórios Personalizados</h3>
        <p>Crie relatórios que atendem às necessidades da sua equipe e melhore sua análise de dados.</p>
      </div>
      <div class="feature">
        <h3>Agenda Integrada</h3>
        <p>Mantenha suas reuniões e eventos organizados em um calendário fácil de usar.</p>
      </div>
      <div class="feature">
        <h3>Apoio e Suporte Dedicado</h3>
        <p>Nossa equipe está pronta para ajudar sempre que precisar.</p>
      </div>
    </div>

    <!-- Chamada para Ação -->
    <p>
      <a href="https://www.smartgabinete.com.br" target="_blank" class="cta-button">Experimente por 30 dias grátis</a>
    </p>
  </div>

  <!-- Rodapé -->
  <div class="footer">
    <p>© 2024 Smart Gabinete. Todos os direitos reservados.</p>
    <p>
      <a href="https://www.smartgabinete.com.br/">Página Inicial</a> | 
      <a href="https://www.smartgabinete.com.br/login">login</a> | 
      <a href="https://www.smartgabinete.com.br/login/singup">Cadastrar</a>
    </p>
  </div>
</div>

</body>
</html>
`

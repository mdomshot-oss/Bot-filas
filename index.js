const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// valores permitidos
const valoresPermitidos = [1, 2, 3, 5, 10, 20, 100];

// fila simples
let fila = [];

client.on("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const comando = args[0];

  // entrar na fila
  if (comando === "!fila") {
    const valor = parseInt(args[1]);

    if (!valoresPermitidos.includes(valor)) {
      return message.reply(
        `❌ Valor inválido. Use: ${valoresPermitidos.join(", ")}`
      );
    }

    if (fila.find(u => u.id === message.author.id)) {
      return message.reply("⚠️ Você já está na fila.");
    }

    if (fila.length >= 2) {
      return message.reply("⛔ A fila já está cheia.");
    }

    fila.push({
      id: message.author.id,
      user: message.author,
      valor
    });

    message.reply(`✅ Entrou na fila com valor **R$ ${valor}**`);

    // quando completar 2 jogadores
    if (fila.length === 2) {
      const guild = message.guild;

      const canal = await guild.channels.create({
        name: `jogo-${fila[0].user.username}-${fila[1].user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: fila[0].id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          {
            id: fila[1].id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      canal.send(
        `🎮 **Fila completa!**  
👥 Jogadores: <@${fila[0].id}> x <@${fila[1].id}>  
💰 Valor: **R$ ${fila[0].valor}**  

📝 Conversem aqui sobre as **regras do jogo** antes de começar.`
      );

      // limpa a fila
      fila = [];
    }
  }

  // sair da fila
  if (comando === "!sair") {
    fila = fila.filter(u => u.id !== message.author.id);
    message.reply("🚪 Você saiu da fila.");
  }
});

client.login(process.env.TOKEN);
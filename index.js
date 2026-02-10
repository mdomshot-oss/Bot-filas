const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

// ===== CONFIG =====
const CONFIG_FILE = "./config.json";

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify({
      nomeFila: "TOKY APOSTAS",
      valores: [1, 2, 3, 5, 10, 20, 100],
      modos: {
        "1v1": 2,
        "2v2": 4,
        "3v3": 6,
        "4v4": 8
      },
      pagamento: "PIX: sua-chave-aqui",
      filaAtiva: true
    }, null, 2)
  );
}

let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
let fila = {};

function salvarConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ===== BOT =====
client.on("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// ===== COMANDO PARA ABRIR PAINEL =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!painel") {
    if (!config.filaAtiva) {
      return message.reply("⛔ A fila está fechada.");
    }

    const rowModos = new ActionRowBuilder().addComponents(
      ...Object.keys(config.modos).map(modo =>
        new ButtonBuilder()
          .setCustomId(`modo_${modo}`)
          .setLabel(modo)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await message.reply({
      content: `🏷️ **${config.nomeFila}**\n\n🎮 Escolha o modo:`,
      components: [rowModos]
    });
  }

  // ===== ADMIN =====
  if (message.content.startsWith("!set")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas admins.");
    }

    const args = message.content.split(" ").slice(1);
    const tipo = args.shift();

    if (tipo === "nome") {
      config.nomeFila = args.join(" ");
      salvarConfig();
      return message.reply("✅ Nome da fila atualizado.");
    }

    if (tipo === "pagamento") {
      config.pagamento = args.join(" ");
      salvarConfig();
      return message.reply("✅ Pagamento atualizado.");
    }

    if (tipo === "on") {
      config.filaAtiva = true;
      salvarConfig();
      return message.reply("🟢 Fila aberta.");
    }

    if (tipo === "off") {
      config.filaAtiva = false;
      salvarConfig();
      return message.reply("🔴 Fila fechada.");
    }
  }
});

// ===== BOTÕES =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // ===== ESCOLHA DO MODO =====
  if (interaction.customId.startsWith("modo_")) {
    const modo = interaction.customId.replace("modo_", "");

    fila[userId] = { modo, valor: null };

    const rowValores = new ActionRowBuilder().addComponents(
      ...config.valores.map(valor =>
        new ButtonBuilder()
          .setCustomId(`valor_${valor}`)
          .setLabel(`R$ ${valor}`)
          .setStyle(ButtonStyle.Success)
      )
    );

    return interaction.reply({
      content: `🎮 Modo escolhido: **${modo}**\n💰 Agora escolha o valor:`,
      components: [rowValores],
      ephemeral: true
    });
  }

  // ===== ESCOLHA DO VALOR =====
  if (interaction.customId.startsWith("valor_")) {
    const valor = Number(interaction.customId.replace("valor_", ""));
    const dados = fila[userId];

    if (!dados) {
      return interaction.reply({ content: "❌ Selecione o modo primeiro.", ephemeral: true });
    }

    dados.valor = valor;

    const lista = Object.entries(fila)
      .filter(([_, d]) => d.modo === dados.modo && d.valor === valor)
      .map(([id]) => id);

    lista.push(userId);

    const limite = config.modos[dados.modo];

    if (lista.length >= limite) {
      const guild = interaction.guild;

      const canal = await guild.channels.create({
        name: `jogo-${dados.modo}-${valor}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          ...lista.map(id => ({
            id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }))
        ]
      });

      await canal.send(
        `🏷️ **${config.nomeFila}**\n\n` +
        `🎮 Modo: **${dados.modo}**\n` +
        `💰 Valor: **R$ ${valor}**\n\n` +
        `👥 Jogadores:\n${lista.map(id => `<@${id}>`).join("\n")}\n\n` +
        `💳 ${config.pagamento}\n📝 Conversem aqui as regras.`
      );

      lista.forEach(id => delete fila[id]);
    }

    return interaction.reply({
      content: `✅ Entrou na fila!\n🎮 ${dados.modo} | 💰 R$${valor}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
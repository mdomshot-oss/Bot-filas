const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const filas = {};

client.once("ready", () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!teste") {
    return message.reply("Estou vivo ✅");
  }

  if (message.content === "!fila") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("entrar")
        .setLabel("Entrar na fila")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("sair")
        .setLabel("Sair da fila")
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({
      content: "🎮 **FILA DE APOSTAS**\nEscolha abaixo:",
      components: [row]
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  if (!filas[userId]) {
    filas[userId] = { valor: null, modo: null };
  }

  if (interaction.customId === "entrar") {
    const rowModo = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("1v1").setLabel("1v1").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("2v2").setLabel("2v2").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("3v3").setLabel("3v3").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("4v4").setLabel("4v4").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      content: "Escolha o **modo de jogo**:",
      components: [rowModo],
      ephemeral: true
    });
  }

  if (["1v1", "2v2", "3v3", "4v4"].includes(interaction.customId)) {
    filas[userId].modo = interaction.customId;

    const rowValor = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("v1").setLabel("1").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("v2").setLabel("2").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("v5").setLabel("5").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("v10").setLabel("10").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("v20").setLabel("20").setStyle(ButtonStyle.Secondary)
    );

    return interaction.update({
      content: `Modo escolhido: **${interaction.customId}**\nAgora escolha o **valor**:`,
      components: [rowValor]
    });
  }

  if (interaction.customId.startsWith("v")) {
    const valor = interaction.customId.replace("v", "");
    filas[userId].valor = valor;

    return interaction.update({
      content: `✅ Você entrou na fila!\n🎮 Modo: **${filas[userId].modo}**\n💰 Valor: **${valor}**`,
      components: []
    });
  }

  if (interaction.customId === "sair") {
    delete filas[userId];
    return interaction.reply({
      content: "❌ Você saiu da fila",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
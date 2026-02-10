const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
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

// CONFIG
const ORG_NAME = "ORG TK";
const VALORES = [1, 2, 3, 5, 10, 20, 100];
const MODOS = {
  "1v1": 2,
  "2v2": 4,
  "3v3": 6,
  "4v4": 8
};

// ESTADO
let fila = [];
let modoAtual = null;
let valorAtual = null;

// READY
client.once("ready", () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

// COMANDO !fila
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!fila") {
    fila = [];
    modoAtual = null;
    valorAtual = null;

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle(`🏆 ${ORG_NAME} 0% TAXA 🏆`)
      .setDescription(
        "🎮 **Escolha o modo e o valor**\n\n" +
        "👥 **Jogadores na fila:**\nNenhum ainda"
      )
      .setFooter({ text: `${ORG_NAME} • Sistema de Fila` });

    const rowModo = new ActionRowBuilder().addComponents(
      Object.keys(MODOS).map(m =>
        new ButtonBuilder()
          .setCustomId(`modo_${m}`)
          .setLabel(m)
          .setStyle(ButtonStyle.Primary)
      )
    );

    await message.channel.send({
      embeds: [embed],
      components: [rowModo]
    });
  }
});

// INTERAÇÕES
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  // ESCOLHER MODO
  if (interaction.customId.startsWith("modo_")) {
    modoAtual = interaction.customId.replace("modo_", "");

    const rowValor = new ActionRowBuilder().addComponents(
      VALORES.map(v =>
        new ButtonBuilder()
          .setCustomId(`valor_${v}`)
          .setLabel(`R$ ${v}`)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    return interaction.update({
      content: `Modo escolhido: **${modoAtual}**\nAgora escolha o valor:`,
      components: [rowValor]
    });
  }

  // ESCOLHER VALOR
  if (interaction.customId.startsWith("valor_")) {
    valorAtual = interaction.customId.replace("valor_", "");

    const rowFila = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("entrar")
        .setLabel("🟢 Entrar na fila")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("sair")
        .setLabel("🔴 Sair da fila")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.update({
      content: `🎮 **${modoAtual}** | 💰 **R$ ${valorAtual}**\nClique para entrar na fila`,
      components: [rowFila]
    });
  }

  // ENTRAR NA FILA
  if (interaction.customId === "entrar") {
    if (fila.includes(user.id)) {
      return interaction.reply({ content: "Você já está na fila.", ephemeral: true });
    }

    fila.push(user.id);

    await interaction.reply({ content: "✅ Você entrou na fila!", ephemeral: true });

    // SE FILA ENCHER → CRIAR CANAL
    if (fila.length === MODOS[modoAtual]) {
      const channel = await guild.channels.create({
        name: `🎮-${modoAtual}-r${valorAtual}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          ...fila.map(id => ({
            id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }))
        ]
      });

      await channel.send(
        `🏆 **${ORG_NAME}**\n` +
        `🎮 Modo: **${modoAtual}**\n` +
        `💰 Valor: **R$ ${valorAtual}**\n\n` +
        `👥 Jogadores:\n${fila.map(id => `<@${id}>`).join("\n")}`
      );

      fila = [];
      modoAtual = null;
      valorAtual = null;
    }
  }

  // SAIR DA FILA
  if (interaction.customId === "sair") {
    fila = fila.filter(id => id !== user.id);
    return interaction.reply({ content: "❌ Você saiu da fila.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

// ===== CONFIG =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== DADOS =====
let fila = [];
let temp = {}; // dados temporários por usuário
let mensagemFilaId = null;

// ===== FUNÇÃO EMBED =====
function criarEmbed() {
  return new EmbedBuilder()
    .setColor("#FFD100")
    .setTitle("🏆 3x3 | ORG")
    .setDescription(
      "🎮 **Formato:** Personalizado\n" +
      "💰 **Valor:** Pontos/Fichas\n\n" +
      "👥 **Jogadores:**\n" +
      (fila.length
        ? fila.map((u, i) => `${i + 1}. ${u.nome} | ${u.modo} | ${u.valor}`).join("\n")
        : "_Nenhum jogador na fila._")
    )
    .setFooter({ text: "Sistema de Fila" });
}

// ===== BOT ONLINE =====
client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

// ===== COMANDO PARA CRIAR A FILA =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!fila") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("entrar")
        .setLabel("✅ Entrar na Fila")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("sair")
        .setLabel("❌ Sair da Fila")
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      embeds: [criarEmbed()],
      components: [row]
    });

    mensagemFilaId = msg.id;
  }
});

// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {
  // BOTÕES
  if (interaction.isButton()) {
    const userId = interaction.user.id;

    if (interaction.customId === "entrar") {
      temp[userId] = { id: userId, nome: interaction.user.username };

      const modoMenu = new StringSelectMenuBuilder()
        .setCustomId("modo")
        .setPlaceholder("🎮 Escolha o modo")
        .addOptions(
          { label: "Normal", value: "Normal" },
          { label: "Full", value: "Full" }
        );

      return interaction.reply({
        content: "Escolha o **modo**:",
        components: [new ActionRowBuilder().addComponents(modoMenu)],
        ephemeral: true
      });
    }

    if (interaction.customId === "sair") {
      fila = fila.filter(u => u.id !== userId);
      await interaction.reply({ content: "❌ Você saiu da fila.", ephemeral: true });
      return atualizarMensagem(interaction);
    }
  }

  // SELECT MENUS
  if (interaction.isStringSelectMenu()) {
    const userId = interaction.user.id;

    if (interaction.customId === "modo") {
      temp[userId].modo = interaction.values[0];

      const valorMenu = new StringSelectMenuBuilder()
        .setCustomId("valor")
        .setPlaceholder("💰 Escolha o valor")
        .addOptions(
          { label: "10", value: "10" },
          { label: "20", value: "20" },
          { label: "Livre", value: "Livre" }
        );

      return interaction.update({
        content: "Escolha o **valor**:",
        components: [new ActionRowBuilder().addComponents(valorMenu)]
      });
    }

    if (interaction.customId === "valor") {
      temp[userId].valor = interaction.values[0];
      fila.push(temp[userId]);
      delete temp[userId];

      await interaction.update({
        content: "✅ Entrou na fila!",
        components: []
      });

      return atualizarMensagem(interaction);
    }
  }
});

// ===== ATUALIZAR A MENSAGEM DA FILA =====
async function atualizarMensagem(interaction) {
  try {
    const channel = interaction.channel;
    const msg = await channel.messages.fetch(mensagemFilaId);
    await msg.edit({ embeds: [criarEmbed()] });
  } catch (e) {
    console.log("Não foi possível atualizar a mensagem.");
  }
}

// ===== LOGIN =====
client.login(process.env.TOKEN);

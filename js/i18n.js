(function (root) {
  "use strict";

  var LANG_KEY = "dice2.lang.v1";
  var DEFAULT = "pt";

  var DICT = {
    pt: {
      "app.title": "Dice2 — Rolador de Dados para Fichas (D&D e Call of Cthulhu)",
      "app.tagline": "Importe fichas em PDF, digitalize em JSON e role dados a partir dos atributos.",
      "lang.pt": "PT",
      "lang.en": "EN",

      "tab.sheets": "Fichas",
      "tab.roll": "Rolagem",
      "tab.create": "Criar",
      "tab.history": "Histórico",

      "common.roll": "Rolar",
      "common.rollAgain": "Rolar de novo",
      "common.clear": "Limpar",
      "common.remove": "Remover",
      "common.exportJson": "Baixar JSON",
      "common.exportPdf": "Baixar PDF",
      "common.exportAll": "Exportar todas (.json)",
      "common.importPdf": "Importar PDF",
      "common.importJson": "Importar JSON",

      "sheets.importTitle": "Importar fichas",
      "sheets.importDesc": "Aceita os PDFs preenchíveis (AcroForm) do D&D 5e e do Call of Cthulhu 7e, além de arquivos <code>.json</code> já digitalizados. Tudo é processado no seu navegador, sem servidor.",
      "sheets.dropStrong": "Arraste e solte",
      "sheets.dropRest": "os PDFs/JSONs aqui",
      "sheets.savedTitle": "Fichas salvas",
      "sheets.noSheets": "Nenhuma ficha ainda. Importe um PDF acima.",
      "sheets.source": "origem: ",
      "sheets.confirmRemove": "Remover esta ficha?",

      "roll.selectPrompt": "Escolha uma ficha e clique em um atributo para rolar.",
      "roll.noSheet": "Importe uma ficha para começar a rolar.",
      "roll.searchPlaceholder": "Buscar atributo, perícia, arma…",
      "roll.searchHint": "Digite para filtrar, use <kbd>↑</kbd>/<kbd>↓</kbd> e <kbd>Enter</kbd> para rolar. Uma expressão como <code>2d6+3</code> também funciona.",
      "roll.freePlaceholder": "Ex.: 2d6+3, 1d20, 4d6, 1d100",
      "roll.searchNone": "Nada encontrado para “{q}”.",

      "section.abilities": "Atributos",
      "section.characteristics": "Atributos",
      "section.identity": "Identidade",
      "section.vitality": "Vitalidade",
      "section.quick": "Testes rápidos",
      "section.saves": "Testes de Resistência",
      "section.skills": "Perícias",
      "section.attacks": "Ataques",
      "section.spells": "Magias",
      "section.details": "Detalhes",
      "section.combat": "Combate",
      "section.quickRolls": "Rolagens rápidas",
      "section.difficulty": "Dificuldade",
      "section.rollMode": "Modo de rolagem",
      "section.quickDice": "Dados rápidos",
      "mode.normal": "Normal",
      "mode.adv": "Vantagem",
      "mode.dis": "Desvantagem",
      "quick.qty": "Qtd",
      "quick.mod": "Mod",

      "vital.hpCurrent": "PV atuais",
      "vital.hpMax": "PV máx.",
      "vital.mpCurrent": "PM atuais",
      "vital.luck": "Sorte",
      "vital.sanity": "Sanidade",
      "vital.ac": "CA",
      "vital.prof": "Prof.",
      "vital.speed": "Desloc.",
      "vital.passive": "Perc. passiva",
      "vital.hitDice": "Dados de vida",
      "vital.move": "MOV",
      "vital.build": "Build",
      "vital.sanityMax": "SAN máx.",
      "word.name": "Nome",
      "vital.db": "Bônus de Dano",
      "vital.spellClass": "Classe",
      "vital.spellDC": "CD",
      "vital.spellAtk": "Ataque",
      "vital.level": "Nível",
      "short.hp": "PV",
      "short.ac": "CA",
      "short.san": "SAN",
      "word.attack": "Ataque",
      "word.damage": "Dano",
      "word.ability": "Habilidade",

      "detail.classLevel": "Classe e nível",
      "detail.race": "Raça",
      "detail.background": "Antecedente",
      "detail.alignment": "Tendência",
      "detail.player": "Jogador",
      "detail.personalityTraits": "Traços de Personalidade",
      "detail.ideals": "Ideais",
      "detail.bonds": "Ligações",
      "detail.flaws": "Defeitos",
      "detail.features": "Características e Habilidades",
      "detail.proficiencies": "Idiomas e Outras Proficiências",
      "detail.equipment": "Equipamento",
      "detail.occupation": "Ocupação",
      "detail.age": "Idade",
      "detail.birthplace": "Naturalidade",
      "detail.residence": "Residência",
      "detail.gender": "Gênero",

      "roll.testOf": "Teste de {name}",
      "roll.saveOf": "Teste de Resistência de {name}",
      "roll.skillOf": "Perícia: {name}",
      "roll.attackOf": "Ataque: {name}",
      "roll.damageOf": "Dano: {name}",
      "roll.initiative": "Iniciativa",
      "roll.magicAttack": "Ataque mágico",
      "roll.free": "Rolagem livre ({expr})",
      "roll.quick": "Dados: {expr}",
      "roll.dbLabel": "Bônus de Dano ({db})",
      "roll.critDamage": "Rolar dano crítico",
      "roll.impale": "Dano extremo (máx.)",
      "roll.spendLuck": "Gastar Sorte (-{cost})",
      "roll.push": "Forçar (rerolar)",
      "roll.half": "metade",
      "roll.fifth": "1/5",
      "roll.subAttack": "ataque",
      "roll.subDamage": "dano",
      "roll.subValue": "valor",
      "roll.subScore": "valor",

      "dnd.crit": "Crítico (20 natural)",
      "dnd.fumble": "Falha (1 natural)",

      "coc.critical": "Crítico",
      "coc.extreme": "Extremo",
      "coc.hard": "Difícil",
      "coc.regular": "Regular",
      "coc.failure": "Falha",
      "coc.fumble": "Desastre",
      "coc.success": "Sucesso: ",
      "coc.failurePrefix": "Falha: ",
      "coc.vs": " vs valor ",
      "coc.detail": "1d100 [{roll}] vs valor {target} → {level}",
      "coc.dmgDetail": "Dano {damage} + DB {db}",
      "coc.dmgDetailRoll": "{expr} [{rolled}] + DB {db} = {total}",
      "coc.impaleDetail": "Impalamento: {expr} no máximo ({max}) + DB {db} = {total}",
      "coc.luckSpent": "Sorte gasta: -{cost} → sucesso (rolagem {roll} vs {target})",
      "coc.pushNote": "Forçado — ",

      "diff.regular": "Regular",
      "diff.hard": "Difícil",
      "diff.extreme": "Extremo",

      "group.attr": "Atributo",
      "group.char": "Característica",
      "group.skill": "Perícia",
      "group.save": "Resistência",
      "group.attack": "Ataque",
      "group.combat": "Combate",
      "group.damage": "Dano",
      "group.magic": "Magia",
      "group.quick": "Rápida",
      "group.init": "Iniciativa",
      "group.damageBonus": "Outros",
      "group.all": "Todos",

      "history.title": "Histórico de rolagens",
      "history.empty": "Sem rolagens ainda.",

      "status.processing": "Processando {n} arquivo(s)…",
      "status.importedOk": "Ok! {n} ficha(s) importada(s).",
      "status.importedPartial": "{n} importada(s), mas: {errs}",
      "status.failed": "Falha: {errs}",
      "status.jsonInvalid": "JSON sem fichas válidas",
      "status.notRecognized": "formato de ficha não reconhecido",
      "status.exportStarted": "Download iniciado: fichas.dice2.json",
      "status.pdfWorking": "Gerando PDF…",
      "status.pdfExported": "PDF gerado a partir da ficha editada.",
      "status.pdfMissing": "PDF original não encontrado (reenvie o PDF para poder exportar).",
      "status.pdfUnavailable": "Biblioteca de PDF não carregada.",
      "status.pdfError": "Falha ao gerar PDF: {err}",
      "status.pdfTemplateError": "Não foi possível carregar o modelo de PDF do sistema ({err}). Abra o app pelo link publicado (GitHub Pages) para usar este recurso.",
      "status.nothingExport": "Nenhuma ficha para exportar.",
      "status.invalidExpr": "Expressão inválida",
      "status.storageWarn": "Aviso: armazenamento local indisponível neste navegador; as fichas ficarão apenas na memória desta aba.",

      "editor.toggle": "Editar",
      "editor.done": "Concluir",
      "editor.hint": "Edite os valores e clique em Concluir. As alterações são salvas automaticamente.",
      "editor.mod": "mod",
      "editor.half": "metade",
      "theme.toggle": "Alternar tema",

      "build.title": "Criar ficha",
      "build.reset": "Limpar",
      "build.descRules": "Modo Regras: use orçamento de pontos e calculamos os valores derivados automaticamente.",
      "build.descFree": "Modo Livre: informe os valores manualmente; os derivados são recalculados sempre.",
      "build.system": "Sistema",
      "build.mode": "Modo",
      "build.modeRules": "Regras",
      "build.modeFree": "Livre",
      "build.identity": "Identidade",
      "build.class": "Classe",
      "build.level": "Nível",
      "build.scores": "Atributos",
      "build.method": "Método",
      "build.pointBuy": "Compra por pontos",
      "build.array": "Array padrão",
      "build.roll": "Rolar",
      "build.roll4d6": "Rolar 4d6 (descarta menor)",
      "build.pointsLeft": "Pontos restantes",
      "build.pointsSpent": "gastos",
      "build.mod": "mod",
      "build.skillProfs": "Perícias ({n})",
      "build.saves": "Resistências",
      "build.derived": "Valores derivados",
      "build.overrides": "Ajustes",
      "build.acOptional": "CA (opcional)",
      "build.hpOptional": "PV (opcional)",
      "build.rollAll": "Rolar tudo",
      "build.skills": "Perícias",
      "build.base": "Base",
      "build.value": "Valor",
      "build.occShort": "Ocup.",
      "build.intShort": "Inter.",
      "build.total": "Total",
      "build.customOcc": "Personalizada",
      "build.secondAbility": "2º atributo",
      "build.auto": "Automático",
      "build.customName": "Nome da ocupação",
      "build.creditMin": "Crédito mín.",
      "build.creditMax": "Crédito máx.",
      "build.addSkill": "Perícia de ocupação",
      "build.add": "Adicionar",
      "build.occPoints": "Pontos de ocupação",
      "build.occLeft": "Ocup. restantes",
      "build.interestPoints": "Pontos de interesse",
      "build.interestLeft": "Inter. restantes",
      "build.credit": "Crédito",
      "build.create": "Criar ficha",
      "build.created": "Ficha criada!",
      "build.errName": "Informe um nome para a ficha.",
      "build.errNoClass": "Escolha uma classe.",
      "build.errRange": "Ajuste os atributos entre 8 e 15.",
      "build.errPoints": "Você gastou {n} de {max} pontos.",
      "build.errArray": "Use os valores do array padrão (15, 14, 13, 12, 10, 8).",
      "build.errSkillCount": "Escolha no máximo {n} perícias.",
      "build.errChars": "Preencha todas as características.",
      "build.errOccPoints": "Pontos de ocupação excedidos em {n}.",
      "build.errIntPoints": "Pontos de interesse excedidos em {n}.",
      "build.errCredit": "Crédito {val} fora do intervalo {min}–{max}."
    },

    en: {
      "app.title": "Dice2 — Dice Roller for Character Sheets (D&D and Call of Cthulhu)",
      "app.tagline": "Import PDF sheets, digitize them into JSON and roll dice from the attributes.",
      "lang.pt": "PT",
      "lang.en": "EN",

      "tab.sheets": "Sheets",
      "tab.roll": "Roll",
      "tab.create": "Create",
      "tab.history": "History",

      "common.roll": "Roll",
      "common.rollAgain": "Roll again",
      "common.clear": "Clear",
      "common.remove": "Remove",
      "common.exportJson": "Download JSON",
      "common.exportPdf": "Download PDF",
      "common.exportAll": "Export all (.json)",
      "common.importPdf": "Import PDF",
      "common.importJson": "Import JSON",

      "sheets.importTitle": "Import sheets",
      "sheets.importDesc": "Accepts fillable PDFs (AcroForm) from D&D 5e and Call of Cthulhu 7e, plus already digitized <code>.json</code> files. Everything runs in your browser, with no server.",
      "sheets.dropStrong": "Drag and drop",
      "sheets.dropRest": "the PDFs/JSONs here",
      "sheets.savedTitle": "Saved sheets",
      "sheets.noSheets": "No sheets yet. Import a PDF above.",
      "sheets.source": "source: ",
      "sheets.confirmRemove": "Remove this sheet?",

      "roll.selectPrompt": "Pick a sheet and click an attribute to roll.",
      "roll.noSheet": "Import a sheet to start rolling.",
      "roll.searchPlaceholder": "Search attribute, skill, weapon…",
      "roll.searchHint": "Type to filter, use <kbd>↑</kbd>/<kbd>↓</kbd> and <kbd>Enter</kbd> to roll. An expression like <code>2d6+3</code> works too.",
      "roll.freePlaceholder": "E.g. 2d6+3, 1d20, 4d6, 1d100",
      "roll.searchNone": "Nothing found for “{q}”.",

      "section.abilities": "Abilities",
      "section.characteristics": "Characteristics",
      "section.identity": "Identity",
      "section.vitality": "Vitals",
      "section.quick": "Quick rolls",
      "section.saves": "Saving Throws",
      "section.skills": "Skills",
      "section.attacks": "Attacks",
      "section.spells": "Spells",
      "section.details": "Details",
      "section.combat": "Combat",
      "section.quickRolls": "Quick rolls",
      "section.difficulty": "Difficulty",
      "section.rollMode": "Roll mode",
      "section.quickDice": "Quick dice",
      "mode.normal": "Normal",
      "mode.adv": "Advantage",
      "mode.dis": "Disadvantage",
      "quick.qty": "Qty",
      "quick.mod": "Mod",

      "vital.hpCurrent": "HP current",
      "vital.hpMax": "HP max",
      "vital.mpCurrent": "MP current",
      "vital.luck": "Luck",
      "vital.sanity": "Sanity",
      "vital.ac": "AC",
      "vital.prof": "Prof.",
      "vital.speed": "Speed",
      "vital.passive": "Passive Perc.",
      "vital.hitDice": "Hit Dice",
      "vital.move": "MOV",
      "vital.build": "Build",
      "vital.sanityMax": "SAN max",
      "word.name": "Name",
      "vital.db": "Damage Bonus",
      "vital.spellClass": "Class",
      "vital.spellDC": "DC",
      "vital.spellAtk": "Attack",
      "vital.level": "Level",
      "short.hp": "HP",
      "short.ac": "AC",
      "short.san": "SAN",
      "word.attack": "Attack",
      "word.damage": "Damage",
      "word.ability": "Skill",

      "detail.classLevel": "Class & level",
      "detail.race": "Race",
      "detail.background": "Background",
      "detail.alignment": "Alignment",
      "detail.player": "Player",
      "detail.personalityTraits": "Personality Traits",
      "detail.ideals": "Ideals",
      "detail.bonds": "Bonds",
      "detail.flaws": "Flaws",
      "detail.features": "Features & Traits",
      "detail.proficiencies": "Proficiencies & Languages",
      "detail.equipment": "Equipment",
      "detail.occupation": "Occupation",
      "detail.age": "Age",
      "detail.birthplace": "Birthplace",
      "detail.residence": "Residence",
      "detail.gender": "Gender",

      "roll.testOf": "{name} check",
      "roll.saveOf": "{name} saving throw",
      "roll.skillOf": "Skill: {name}",
      "roll.attackOf": "Attack: {name}",
      "roll.damageOf": "Damage: {name}",
      "roll.initiative": "Initiative",
      "roll.magicAttack": "Spell attack",
      "roll.free": "Free roll ({expr})",
      "roll.quick": "Dice: {expr}",
      "roll.dbLabel": "Damage Bonus ({db})",
      "roll.critDamage": "Roll critical damage",
      "roll.impale": "Extreme damage (max)",
      "roll.spendLuck": "Spend Luck (-{cost})",
      "roll.push": "Push (reroll)",
      "roll.half": "half",
      "roll.fifth": "1/5",
      "roll.subAttack": "attack",
      "roll.subDamage": "damage",
      "roll.subValue": "score",
      "roll.subScore": "score",

      "dnd.crit": "Critical (natural 20)",
      "dnd.fumble": "Miss (natural 1)",

      "coc.critical": "Critical",
      "coc.extreme": "Extreme",
      "coc.hard": "Hard",
      "coc.regular": "Regular",
      "coc.failure": "Failure",
      "coc.fumble": "Fumble",
      "coc.success": "Success: ",
      "coc.failurePrefix": "Failure: ",
      "coc.vs": " vs target ",
      "coc.detail": "1d100 [{roll}] vs target {target} → {level}",
      "coc.dmgDetail": "Damage {damage} + DB {db}",
      "coc.dmgDetailRoll": "{expr} [{rolled}] + DB {db} = {total}",
      "coc.impaleDetail": "Impale: {expr} at max ({max}) + DB {db} = {total}",
      "coc.luckSpent": "Luck spent: -{cost} → success (roll {roll} vs {target})",
      "coc.pushNote": "Pushed — ",

      "diff.regular": "Regular",
      "diff.hard": "Hard",
      "diff.extreme": "Extreme",

      "group.attr": "Attribute",
      "group.char": "Characteristic",
      "group.skill": "Skill",
      "group.save": "Save",
      "group.attack": "Attack",
      "group.combat": "Combat",
      "group.damage": "Damage",
      "group.magic": "Spell",
      "group.quick": "Quick",
      "group.init": "Initiative",
      "group.damageBonus": "Other",
      "group.all": "All",

      "history.title": "Roll history",
      "history.empty": "No rolls yet.",

      "status.processing": "Processing {n} file(s)…",
      "status.importedOk": "Done! {n} sheet(s) imported.",
      "status.importedPartial": "{n} imported, but: {errs}",
      "status.failed": "Failed: {errs}",
      "status.jsonInvalid": "JSON has no valid sheets",
      "status.notRecognized": "unrecognized sheet format",
      "status.exportStarted": "Download started: fichas.dice2.json",
      "status.pdfWorking": "Generating PDF…",
      "status.pdfExported": "PDF generated from the edited sheet.",
      "status.pdfMissing": "Original PDF not found (re-import the PDF to export).",
      "status.pdfUnavailable": "PDF library not loaded.",
      "status.pdfError": "Failed to generate PDF: {err}",
      "status.pdfTemplateError": "Could not load the system PDF template ({err}). Open the app from the published link (GitHub Pages) to use this feature.",
      "status.nothingExport": "No sheets to export.",
      "status.invalidExpr": "Invalid expression",
      "status.storageWarn": "Warning: local storage is unavailable in this browser; sheets will live only in this tab's memory.",

      "editor.toggle": "Edit",
      "editor.done": "Done",
      "editor.hint": "Edit the values and click Done. Changes are saved automatically.",
      "editor.mod": "mod",
      "editor.half": "half",
      "theme.toggle": "Toggle theme",

      "build.title": "Create sheet",
      "build.reset": "Reset",
      "build.descRules": "Rules mode: use a point budget and derived values are computed automatically.",
      "build.descFree": "Free mode: enter values manually; derived values are always recomputed.",
      "build.system": "System",
      "build.mode": "Mode",
      "build.modeRules": "Rules",
      "build.modeFree": "Free",
      "build.identity": "Identity",
      "build.class": "Class",
      "build.level": "Level",
      "build.scores": "Abilities",
      "build.method": "Method",
      "build.pointBuy": "Point buy",
      "build.array": "Standard array",
      "build.roll": "Roll",
      "build.roll4d6": "Roll 4d6 (drop lowest)",
      "build.pointsLeft": "Points left",
      "build.pointsSpent": "spent",
      "build.mod": "mod",
      "build.skillProfs": "Skills ({n})",
      "build.saves": "Saving throws",
      "build.derived": "Derived values",
      "build.overrides": "Overrides",
      "build.acOptional": "AC (optional)",
      "build.hpOptional": "HP (optional)",
      "build.rollAll": "Roll all",
      "build.skills": "Skills",
      "build.base": "Base",
      "build.value": "Value",
      "build.occShort": "Occ.",
      "build.intShort": "Int.",
      "build.total": "Total",
      "build.customOcc": "Custom",
      "build.secondAbility": "2nd ability",
      "build.auto": "Automatic",
      "build.customName": "Occupation name",
      "build.creditMin": "Credit min.",
      "build.creditMax": "Credit max.",
      "build.addSkill": "Occupation skill",
      "build.add": "Add",
      "build.occPoints": "Occupation points",
      "build.occLeft": "Occ. left",
      "build.interestPoints": "Interest points",
      "build.interestLeft": "Int. left",
      "build.credit": "Credit",
      "build.create": "Create sheet",
      "build.created": "Sheet created!",
      "build.errName": "Enter a name for the sheet.",
      "build.errNoClass": "Choose a class.",
      "build.errRange": "Keep abilities between 8 and 15.",
      "build.errPoints": "You spent {n} of {max} points.",
      "build.errArray": "Use the standard array values (15, 14, 13, 12, 10, 8).",
      "build.errSkillCount": "Choose at most {n} skills.",
      "build.errChars": "Fill in all characteristics.",
      "build.errOccPoints": "Occupation points exceeded by {n}.",
      "build.errIntPoints": "Interest points exceeded by {n}.",
      "build.errCredit": "Credit {val} outside the {min}–{max} range."
    }
  };

  var TONES = {
    attr: "violet", char: "violet", skill: "blue", save: "teal",
    attack: "red", combat: "red", damage: "amber", magic: "indigo",
    quick: "gold", init: "green", damageBonus: "slate"
  };

  var NAMES = {
    dndAbility: {
      FOR: { pt: "Força", en: "Strength" },
      DES: { pt: "Destreza", en: "Dexterity" },
      CON: { pt: "Constituição", en: "Constitution" },
      INT: { pt: "Inteligência", en: "Intelligence" },
      SAB: { pt: "Sabedoria", en: "Wisdom" },
      CAR: { pt: "Carisma", en: "Charisma" }
    },
    cocChar: {
      str: { pt: "Força", en: "Strength" },
      con: { pt: "Constituição", en: "Constitution" },
      siz: { pt: "Tamanho", en: "Size" },
      dex: { pt: "Destreza", en: "Dexterity" },
      app: { pt: "Aparência", en: "Appearance" },
      int: { pt: "Inteligência", en: "Intelligence" },
      pow: { pt: "Poder", en: "Power" },
      edu: { pt: "Educação", en: "Education" }
    },
    dndSkill: {
      Acrobatics: { pt: "Acrobacia", en: "Acrobatics" },
      Arcana: { pt: "Arcanismo", en: "Arcana" },
      Athletics: { pt: "Atletismo", en: "Athletics" },
      Performance: { pt: "Atuação", en: "Performance" },
      Deception: { pt: "Blefar", en: "Deception" },
      Stealth: { pt: "Furtividade", en: "Stealth" },
      History: { pt: "História", en: "History" },
      Intimidation: { pt: "Intimidação", en: "Intimidation" },
      Insight: { pt: "Intuição", en: "Insight" },
      Investigation: { pt: "Investigação", en: "Investigation" },
      Animal: { pt: "Lidar com Animais", en: "Animal Handling" },
      Medicine: { pt: "Medicina", en: "Medicine" },
      Nature: { pt: "Natureza", en: "Nature" },
      Perception: { pt: "Percepção", en: "Perception" },
      Persuasion: { pt: "Persuasão", en: "Persuasion" },
      SleightofHand: { pt: "Prestidigitação", en: "Sleight of Hand" },
      Religion: { pt: "Religião", en: "Religion" },
      Survival: { pt: "Sobrevivência", en: "Survival" }
    },
    cocSkill: {
      accounting: { pt: "Contabilidade", en: "Accounting" },
      anthropology: { pt: "Antropologia", en: "Anthropology" },
      appraise: { pt: "Avaliação", en: "Appraise" },
      archaeology: { pt: "Arqueologia", en: "Archaeology" },
      art_craft_1: { pt: "Arte/Ofício", en: "Art/Craft" },
      art_craft_2: { pt: "Arte/Ofício", en: "Art/Craft" },
      charm: { pt: "Charme", en: "Charm" },
      climb: { pt: "Escalar", en: "Climb" },
      credit_rating: { pt: "Crédito", en: "Credit Rating" },
      cthulhu_mythos: { pt: "Mito de Cthulhu", en: "Cthulhu Mythos" },
      disguise: { pt: "Disfarce", en: "Disguise" },
      dodge: { pt: "Esquiva", en: "Dodge" },
      drive_auto: { pt: "Dirigir Automóvel", en: "Drive Auto" },
      electrical_repair: { pt: "Reparo Elétrico", en: "Electrical Repair" },
      fast_talk: { pt: "Conversa Rápida", en: "Fast Talk" },
      fighting_brawl: { pt: "Luta (Briga)", en: "Fighting (Brawl)" },
      fighting_1: { pt: "Luta", en: "Fighting" },
      fighting_2: { pt: "Luta", en: "Fighting" },
      firearms_handgun: { pt: "Armas de Fogo (Pistola)", en: "Firearms (Handgun)" },
      firearms_rifle_shotgun: { pt: "Armas de Fogo (Rifle/Espingarda)", en: "Firearms (Rifle/Shotgun)" },
      firearms_1: { pt: "Armas de Fogo", en: "Firearms" },
      first_aid: { pt: "Primeiros Socorros", en: "First Aid" },
      history: { pt: "História", en: "History" },
      intimidate: { pt: "Intimidar", en: "Intimidate" },
      jump: { pt: "Saltar", en: "Jump" },
      language_other_1: { pt: "Idioma (Outro)", en: "Language (Other)" },
      language_other_2: { pt: "Idioma (Outro)", en: "Language (Other)" },
      language_other_3: { pt: "Idioma (Outro)", en: "Language (Other)" },
      language_own: { pt: "Idioma (Nativo)", en: "Language (Own)" },
      law: { pt: "Direito", en: "Law" },
      library_use: { pt: "Uso de Biblioteca", en: "Library Use" },
      listen: { pt: "Escutar", en: "Listen" },
      locksmith: { pt: "Chaveiro", en: "Locksmith" },
      mechanical_repair: { pt: "Reparo Mecânico", en: "Mechanical Repair" },
      medicine: { pt: "Medicina", en: "Medicine" },
      natural_world: { pt: "Mundo Natural", en: "Natural World" },
      navigate: { pt: "Navegação", en: "Navigate" },
      occult: { pt: "Ocultismo", en: "Occult" },
      persuade: { pt: "Persuadir", en: "Persuade" },
      pilot: { pt: "Pilotagem", en: "Pilot" },
      psychoanalysis: { pt: "Psicanálise", en: "Psychoanalysis" },
      psychology: { pt: "Psicologia", en: "Psychology" },
      ride: { pt: "Cavalgar", en: "Ride" },
      science_1: { pt: "Ciência", en: "Science" },
      science_2: { pt: "Ciência", en: "Science" },
      science_3: { pt: "Ciência", en: "Science" },
      sleight_of_hand: { pt: "Prestidigitação", en: "Sleight of Hand" },
      spot_hidden: { pt: "Observar", en: "Spot Hidden" },
      stealth: { pt: "Furtividade", en: "Stealth" },
      survival: { pt: "Sobrevivência", en: "Survival" },
      swim: { pt: "Nadar", en: "Swim" },
      throw: { pt: "Arremessar", en: "Throw" },
      track: { pt: "Rastrear", en: "Track" },
      custom_1: { pt: "Personalizada", en: "Custom" },
      custom_2: { pt: "Personalizada", en: "Custom" },
      custom_3: { pt: "Personalizada", en: "Custom" },
      custom_4: { pt: "Personalizada", en: "Custom" }
    }
  };

  function detectDefault() {
    var nav = root.navigator && (root.navigator.language || root.navigator.userLanguage);
    return nav && /^en/i.test(nav) ? "en" : "pt";
  }

  var lang = DEFAULT;
  try {
    var saved = root.localStorage && root.localStorage.getItem(LANG_KEY);
    if (saved === "pt" || saved === "en") lang = saved;
    else lang = detectDefault();
  } catch (e) { lang = detectDefault(); }

  var listeners = [];

  function t(key, vars) {
    var d = DICT[lang] || DICT[DEFAULT];
    var s = d[key];
    if (s === undefined) s = (DICT[DEFAULT][key] !== undefined ? DICT[DEFAULT][key] : key);
    if (vars) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] !== undefined && vars[k] !== null ? vars[k] : m;
      });
    }
    return s;
  }

  function nameOf(mapName, key, fallback) {
    var map = NAMES[mapName];
    var entry = map && map[key];
    if (entry && entry[lang]) return entry[lang];
    if (entry && entry[DEFAULT]) return entry[DEFAULT];
    return fallback !== undefined && fallback !== null && fallback !== "" ? fallback : key;
  }

  function abilityName(system, item) {
    if (!item) return "";
    var map = system === "dnd" ? "dndAbility" : "cocChar";
    return nameOf(map, item.key, item.name);
  }

  function skillName(system, item) {
    if (!item) return "";
    if (system === "coc" && item.base && item.name && item.name !== item.base) return item.name;
    return nameOf(system === "dnd" ? "dndSkill" : "cocSkill", item.field, item.name);
  }

  function groupName(groupKey) {
    return t("group." + groupKey);
  }

  function toneFor(groupKey) { return TONES[groupKey] || "slate"; }

  function apply(rootEl) {
    var scope = rootEl || root.document;
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    scope.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    if (root.document) {
      root.document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
      root.document.title = t("app.title");
    }
    var toggles = scope.querySelectorAll("[data-lang]");
    toggles.forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-lang") === lang);
    });
  }

  function set(next) {
    var chosen = next === "en" ? "en" : "pt";
    lang = chosen;
    try { if (root.localStorage) root.localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    apply();
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }

  function onChange(fn) { if (typeof fn === "function") listeners.push(fn); }

  root.I18n = {
    get lang() { return lang; },
    t: t,
    set: set,
    apply: apply,
    onChange: onChange,
    abilityName: abilityName,
    skillName: skillName,
    groupName: groupName,
    toneFor: toneFor,
    names: NAMES
  };
})(window);

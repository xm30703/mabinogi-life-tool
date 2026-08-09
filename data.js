// Mabinogi Life Tool - shared game data
// Edit game/vendor/recipe data here; app.js owns UI/state logic.
const APP_DATA_SCHEMA_VERSION = 1;
const DATA_VERSION = 2;
const PRIORITY_LABEL = {S_PLUS:'S+',S:'S',A:'A',B:'B'};
const TOWN_ORDER = ['提爾克那','杜加德走廊','杜巴頓','庫漢'];
const materials = {
  gearPart:{name:'分解的裝備零件',source:'分解'},
  coal:{name:'煤炭',source:'採礦／交換'},
  steelIngot:{name:'鋼錠',source:'加工'},
  alloy:{name:'合金鋼錠',source:'交換／加工'},
  egg:{name:'雞蛋',source:'採集'},
  lavender:{name:'薰衣草花',source:'採集'},
  alchemyShard:{name:'煉金術碎屑',source:'交換'},
  mayoMeat:{name:'美乃滋炒肉',source:'料理'},
  critPotion:{name:'暴擊秘藥',source:'製作／交換'},
  appleJuice:{name:'蘋果汁',source:'料理'},
  catalystHi:{name:'高級鍊金術再燃燒催化劑',source:'交換'},
  highLog:{name:'高級原木',source:'伐木'},
  resin:{name:'樹液',source:'交換'},
  steamedClam:{name:'蒸蛤蜊',source:'料理'},
  musicBox:{name:'特蕾西原木音樂盒',source:'交換'},
  leather:{name:'皮革',source:'交換／加工'},
  stirVeg:{name:'炒蔬菜',source:'料理'},
  highWood:{name:'高級木材',source:'交換／加工'},

  asparagus:{name:'蘆筍',source:'商店'},
  pepper:{name:'胡椒',source:'商店'},
  salt:{name:'鹽',source:'商店'},
  lemon:{name:'檸檬',source:'商店'},
  tomato:{name:'番茄',source:'商店'},
  garlic:{name:'大蒜',source:'商店'},
  peas:{name:'豌豆',source:'商店'},
  meat:{name:'肉',source:'商店'},
  oil:{name:'食用油',source:'商店'},
  apple:{name:'蘋果',source:'商店'},
  sugar:{name:'糖',source:'商店'},
  cabbage:{name:'高麗菜',source:'商店'},
  shellfish:{name:'貝類',source:'商店'},
  ice:{name:'冰',source:'商店'},
  strawberry:{name:'草莓',source:'商店'},

  bloodHerb:{name:'血紅藥草',source:'商店／採集'},
  arrowFlower:{name:'箭花',source:'商店／採集'},
  magicHerb:{name:'魔力藥草',source:'商店／採集'},
  gritHerb:{name:'毅力草',source:'商店／採集'},
  strongPowder:{name:'壯壯蘑菇粉末',source:'商店／加工'},
  strongJuice:{name:'壯壯蘑菇汁液',source:'商店／加工'},
  mimiMushroom:{name:'咪咪蘑菇',source:'商店／採集'},
  mimiJuice:{name:'咪咪蘑菇汁液',source:'商店／加工'},
  sproutJuice:{name:'新芽蘑菇汁液',source:'商店／加工'},
  petFood:{name:'寵物飼料',source:'商店／製作'},
  lifeStone:{name:'生命的魔力石',source:'交換'},

  fourLeaf:{name:'四葉草',source:'商店／交換'},
  hiddenFlower:{name:'躲躲花',source:'商店／採集'},
  hiddenPowder:{name:'躲躲花粉末',source:'商店／加工'},
  cleanMushroom:{name:'淨淨蘑菇',source:'商店／採集'},
  cleanJuice:{name:'淨淨蘑菇汁液',source:'商店／加工'},

  highHide:{name:'高級生皮',source:'商店／採集'},
  highHidePlus:{name:'高級生皮+',source:'商店／採集'},
  beetle:{name:'獨角仙',source:'商店／採蟲'},
  firefly:{name:'滴答螢火蟲',source:'商店／採蟲'},

  specialSteel:{name:'特殊鋼錠',source:'交換／加工'},
  silverAlloy:{name:'銀合金錠',source:'交換'},

  mackerel:{name:'鯖魚',source:'釣魚'},
  salmon:{name:'鮭魚',source:'釣魚'},
  mayo:{name:'美乃滋',source:'料理前置'},
  brihneCarp:{name:'布里赫內鯉魚',source:'釣魚'},
  silverCrucian:{name:'銀鯽',source:'釣魚'},
  potato:{name:'馬鈴薯',source:'採集'},
  flour:{name:'麵粉',source:'加工'},
  rainbowTrout:{name:'彩虹鱒',source:'釣魚'},
  sweetfish:{name:'香魚',source:'釣魚'},
  onion:{name:'洋蔥',source:'採集／商店'},
  catfish:{name:'鯰魚',source:'釣魚'},
  coinBeetle:{name:'硬幣瓢蟲',source:'採蟲'},
  ruinStone:{name:'廢墟魔力石',source:'交換／副本'}
};

const recipes = {
  mackerelSteak:{
    name:'鯖魚與鮭魚排',priority:'S_PLUS',outputQty:1,tier:1,verified:'KR_REFERENCE',
    ingredients:{mackerel:5,salmon:3,mayo:2,asparagus:4,salt:2,pepper:3}
  },
  meuniere:{
    name:'白肉魚穆尼耶爾',priority:'S',outputQty:1,tier:1,verified:'KR_REFERENCE',
    ingredients:{brihneCarp:5,silverCrucian:3,potato:5,flour:3,lemon:5,salt:3}
  },
  bouillabaisse:{
    name:'法式海鮮湯',priority:'S',outputQty:1,tier:1,verified:'KR_REFERENCE',
    ingredients:{rainbowTrout:4,sweetfish:4,tomato:6,shellfish:5,onion:2,garlic:4}
  },
  fishChips:{
    name:'鯰魚炸魚薯條',priority:'A',outputQty:1,tier:1,verified:'KR_REFERENCE',
    ingredients:{catfish:6,potato:6,flour:3,peas:4,lemon:2,salt:3}
  },
  critPotion:{
    name:'暴擊秘藥',priority:'S_PLUS',outputQty:3,tier:1,verified:'KR_REFERENCE',
    ingredients:{fourLeaf:10,mimiJuice:3,coinBeetle:6,alchemyShard:10}
  },
  advancedCrit:{
    name:'高級暴擊秘藥',priority:'S_PLUS',outputQty:3,tier:2,verified:'KR_REFERENCE',
    ingredients:{critPotion:9,cleanJuice:5,ruinStone:1,alchemyShard:20}
  }
};

const tasks = [
  {id:'tir-furgus-coal',town:'提爾克那',order:1,npc:'佛格斯',type:'barter',priority:'S',verified:'TW_CONFIRMED',input:'gearPart',inputQty:10,output:'coal',outputQty:30,limit:10,why:'煤炭是金屬加工與設備素材；有垃圾裝備零件時交換效率高。'},
  {id:'tir-furgus-alloy',town:'提爾克那',order:1,npc:'佛格斯',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'steelIngot',inputQty:8,output:'alloy',outputQty:4,limit:4,why:'後續可銜接特殊鋼錠與銀合金錠，是高階金屬供應鏈。'},
  {id:'tir-elisa-egg',town:'提爾克那',order:2,npc:'愛麗沙',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'egg',inputQty:10,output:'alchemyShard',outputQty:1,limit:1,why:'煉金術碎屑是多種戰鬥秘藥的核心材料。'},
  {id:'tir-elisa-lav',town:'提爾克那',order:2,npc:'愛麗沙',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'lavender',inputQty:1,output:'alchemyShard',outputQty:1,limit:1,why:'以少量採集物換核心碎屑，價值很高。'},
  {id:'tir-reynard',town:'提爾克那',order:3,npc:'雷納德',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'mayoMeat',inputQty:2,output:'critPotion',outputQty:1,limit:1,why:'直接取得高難副本會用到的戰鬥秘藥。'},
  {id:'tir-lisa',town:'提爾克那',order:4,npc:'麗莎',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'appleJuice',inputQty:1,output:'catalystHi',outputQty:1,limit:1,why:'高階鍊金／再燃燒路線的稀有核心。'},

  {id:'dug-tracy-resin',town:'杜加德走廊',order:1,npc:'特蕾西',type:'barter',priority:'S',verified:'USER_CONFIRMED',input:'highLog',inputQty:5,output:'resin',outputQty:20,limit:5,why:'樹液是高階木材加工的重要瓶頸。'},
  {id:'dug-tracy-box',town:'杜加德走廊',order:1,npc:'特蕾西',type:'barter',priority:'A',verified:'USER_CONFIRMED',input:'steamedClam',inputQty:2,output:'musicBox',outputQty:1,limit:1,why:'可再到杜巴頓找瓦爾特交換皮革，形成跨城供應鏈。'},
  {id:'dug-elven-wood',town:'杜加德走廊',order:2,npc:'艾爾文',type:'barter',priority:'S',verified:'USER_CONFIRMED',input:'stirVeg',inputQty:2,output:'highWood',outputQty:8,limit:2,why:'用料理快速換高級木材，節省大量加工時間。'},

  {id:'dun-glenna-asparagus',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'asparagus',price:10000,limit:null,why:'鯖魚與鮭魚排等高級料理瓶頸食材；有料理目標時才買。'},
  {id:'dun-glenna-pepper',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'pepper',price:2000,limit:null,why:'高級料理常用；依本週料理目標補足。'},
  {id:'dun-glenna-salt',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'salt',price:1000,limit:null,why:'多種高級料理共同材料。'},
  {id:'dun-glenna-lemon',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'lemon',price:3000,limit:null,why:'穆尼耶爾與炸魚薯條等高級料理材料。'},
  {id:'dun-glenna-tomato',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'tomato',price:6800,limit:null,why:'法式海鮮湯核心材料。'},
  {id:'dun-glenna-garlic',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'garlic',price:1200,limit:null,why:'法式海鮮湯與多種高級料理材料。'},
  {id:'dun-glenna-peas',town:'杜巴頓',order:1,npc:'格莉娜',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'peas',price:10000,limit:null,why:'鯰魚炸魚薯條的瓶頸食材。'},

  {id:'dun-manus-blood',town:'杜巴頓',order:2,npc:'馬努斯',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'bloodHerb',price:250,limit:30,why:'傷害減免／強打強化等戰鬥秘藥材料。'},
  {id:'dun-manus-arrow',town:'杜巴頓',order:2,npc:'馬努斯',type:'shop',priority:'A',verified:'USER_CONFIRMED',output:'arrowFlower',price:400,limit:30,why:'移動速度等藥品路線材料。'},
  {id:'dun-manus-grit',town:'杜巴頓',order:2,npc:'馬努斯',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'gritHerb',price:400,limit:30,why:'終極技類秘藥的重要藥草。'},
  {id:'dun-manus-mimi',town:'杜巴頓',order:2,npc:'馬努斯',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'mimiJuice',price:600,limit:30,why:'暴擊、終極、減傷、移速等基礎戰鬥秘藥共用材料。'},
  {id:'dun-manus-sprout',town:'杜巴頓',order:2,npc:'馬努斯',type:'shop',priority:'A',verified:'USER_CONFIRMED',output:'sproutJuice',price:400,limit:30,why:'多種高階藥品的加工材料。'},
  {id:'dun-manus-life',town:'杜巴頓',order:2,npc:'馬努斯',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'petFood',inputQty:20,output:'lifeStone',outputQty:2,limit:2,why:'生命魔力石可作高階藥品材料，也可再到庫漢交換廢墟魔力石；不要無腦全轉掉。'},
  {id:'dun-walter-leather',town:'杜巴頓',order:3,npc:'瓦爾特',type:'barter',priority:'A',verified:'CURRENT_REFERENCE',input:'musicBox',inputQty:1,output:'leather',outputQty:6,limit:2,plannedCount:1,why:'特蕾西原木音樂盒的後續交換；單次 1 個音樂盒可換 6 個皮革。瓦爾特每日可換 2 次，但特蕾西每日只供應 1 個，因此路線預設先安排 1 次；有庫存可再多換 1 次。'},

  {id:'cobh-gilian-four',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'fourLeaf',price:750,limit:null,why:'暴擊秘藥供應鏈核心；依生產目標計算需求，不以限購量代替建議量。'},
  {id:'cobh-gilian-cleanjuice',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'cleanJuice',price:750,limit:null,why:'高級暴擊等高階秘藥直接材料。'},
  {id:'cobh-gilian-clean',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'A',verified:'USER_CONFIRMED',output:'cleanMushroom',price:600,limit:null,why:'可自行加工成汁液；有製藥目標時升為高優先。'},
  {id:'cobh-gilian-hidden',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'B',verified:'USER_CONFIRMED',output:'hiddenFlower',price:150,limit:30,why:'高階恢復／加工用途；沒有相關生產目標可跳過。'},
  {id:'cobh-gilian-hiddenpowder',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'B',verified:'USER_CONFIRMED',output:'hiddenPowder',price:900,limit:30,why:'特殊繃帶等條件式需求。'},
  {id:'cobh-gilian-strongpowder',town:'庫漢',order:1,npc:'基利安',type:'shop',priority:'B',verified:'USER_CONFIRMED',output:'strongPowder',price:600,limit:30,why:'特殊繃帶路線；沒有目標就跳過。'},

  {id:'cobh-connor-asparagus',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'asparagus',price:10000,limit:null,why:'已收錄確認的第二個蘆筍來源；系統只分配尚未滿足的缺口。'},
  {id:'cobh-connor-pepper',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'S_PLUS',verified:'USER_CONFIRMED',output:'pepper',price:2000,limit:null,why:'高級料理共同材料。'},
  {id:'cobh-connor-tomato',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'tomato',price:6800,limit:30,why:'法式海鮮湯材料。'},
  {id:'cobh-connor-peas',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'S',verified:'USER_CONFIRMED',output:'peas',price:10000,limit:30,why:'炸魚薯條材料。'},
  {id:'cobh-connor-beetle',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'B',verified:'USER_CONFIRMED',output:'beetle',price:500,limit:30,why:'強打／減傷類秘藥與伐木定位；無相關目標時建議0。'},
  {id:'cobh-connor-firefly',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'A',verified:'USER_CONFIRMED',output:'firefly',price:400,limit:30,why:'移速／連打類秘藥材料；有對應目標才升高。'},
  {id:'cobh-connor-highhide',town:'庫漢',order:2,npc:'康納',type:'shop',priority:'A',verified:'USER_CONFIRMED',output:'highHidePlus',price:600,limit:30,why:'高階皮革加工與製裝長期素材。'},
  {id:'cobh-connor-ruin',town:'庫漢',order:2,npc:'康納',type:'barter',priority:'A',verified:'CURRENT_REFERENCE',input:'lifeStone',inputQty:5,output:'ruinStone',outputQty:5,limit:5,conditional:'production',why:'高級暴擊秘藥會用到廢墟魔力石；只有生產目標有缺口時才需要換，不建議固定把生命魔力石全換掉。'},

  {id:'cobh-armis-silver',town:'庫漢',order:3,npc:'阿爾米斯',type:'barter',priority:'S_PLUS',verified:'TW_CONFIRMED',input:'specialSteel',inputQty:2,output:'silverAlloy',outputQty:1,limit:1,why:'高階裝備、生活工具與符文／刻印材料的長期戰略物資。'}
];

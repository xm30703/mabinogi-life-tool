// Production planner extension for current Lv.3 crafting ceiling.
// Loaded after data.js and before app.js.
(() => {
  Object.assign(materials, {
    highWoodPlus:{name:'高級木材+',source:'加工'},
    highLogPlus:{name:'高級原木+',source:'採集'},
    highLeatherPlus:{name:'高級皮革+',source:'加工'},
    highCloth:{name:'高級布料',source:'加工'},
    highClothPlus:{name:'高級布料+',source:'加工'},
    highWoolPlus:{name:'高級羊毛+',source:'採集'},
    silk:{name:'絲綢',source:'加工'},
    antiMagicPowder:{name:'抗魔石粉末',source:'地下城／分解'},
    dominanceWeapon:{name:'支配設計圖（武器）',source:'戰鬥／製作素材'},
    dominanceArmor:{name:'支配設計圖（防具）',source:'戰鬥／製作素材'},
    dominanceAccessory:{name:'支配設計圖（飾品）',source:'戰鬥／製作素材'},
    carvedBlueSpinelSS:{name:'雕琢藍色尖晶石 SS',source:'寶石加工'},
    whiteButterfly:{name:'白花蝴蝶',source:'採蟲'},
    ultimatePotion:{name:'終極技秘藥',source:'製作'},
    advancedUltimate:{name:'高級終極技秘藥',source:'製作'},
    damageReductionPotion:{name:'傷害減免秘藥',source:'製作'},
    advancedDamageReduction:{name:'高級傷害減免秘藥',source:'製作'},
    moveSpeedPotion:{name:'移動速度秘藥',source:'製作'},
    advancedMoveSpeed:{name:'高級移動速度秘藥',source:'製作'},
    smashEnhancePotion:{name:'強打強化秘藥',source:'製作'},
    multiEnhancePotion:{name:'連打強化秘藥',source:'製作'},
    aoeEnhancePotion:{name:'範圍強化秘藥',source:'製作'},
    mixedLandslide:{name:'混合強化秘藥（山崩）',source:'製作'},
    mixedStorm:{name:'混合強化秘藥（暴風雨）',source:'製作'},
    mixedRagingWave:{name:'混合強化秘藥（怒濤）',source:'製作'},
    outstandingRecovery:{name:'卓越回復藥水',source:'製作'},
    outstandingAutoRecovery:{name:'卓越自動回復藥水',source:'製作'},
    potionEmulsifier:{name:'強化秘藥乳化劑',source:'藥品加工／製作'},
    rageFragment:{name:'憤怒碎片',source:'戰鬥素材'},
    oblivionFragment:{name:'遺忘碎片',source:'戰鬥素材'},
    wildFragment:{name:'野性碎片',source:'戰鬥素材'}
  });

  Object.assign(recipes.mackerelSteak,{category:'FOOD',plannerVisible:true,note:'頂級戰鬥料理'});
  Object.assign(recipes.meuniere,{category:'FOOD',plannerVisible:true,note:'頂級戰鬥料理'});
  Object.assign(recipes.bouillabaisse,{category:'FOOD',plannerVisible:true,note:'頂級戰鬥料理'});
  Object.assign(recipes.fishChips,{category:'FOOD',plannerVisible:true,note:'頂級戰鬥料理'});
  Object.assign(recipes.critPotion,{category:'MEDICINE_BASE',plannerVisible:true,note:'高級暴擊秘藥的前置成品'});
  Object.assign(recipes.advancedCrit,{category:'MEDICINE_HIGH',plannerVisible:true,note:'目前版本高階戰鬥秘藥'});

  const add = (id, recipe) => { recipes[id] = recipe; };

  add('specialSteel',{name:'特殊鋼錠',priority:'S_PLUS',category:'MATERIAL',plannerVisible:false,outputQty:3,ingredients:{alloy:4,whiteCopperOre:20,coal:12}});
  add('highWoodPlus',{name:'高級木材+',priority:'S',category:'MATERIAL',plannerVisible:false,outputQty:3,ingredients:{highWood:4,highLogPlus:20,resin:12}});
  add('highLeatherPlus',{name:'高級皮革+',priority:'S',category:'MATERIAL',plannerVisible:false,outputQty:3,ingredients:{highLeather:4,highHidePlus:20,tanninPowder:12}});
  add('highCloth',{name:'高級布料',priority:'S',category:'MATERIAL',plannerVisible:false,outputQty:3,ingredients:{fabricPlus:3,highWool:15,wool:8}});
  add('highClothPlus',{name:'高級布料+',priority:'S',category:'MATERIAL',plannerVisible:false,outputQty:3,ingredients:{highCloth:4,highWoolPlus:20,wool:12}});
  add('silk',{name:'絲綢',priority:'A',category:'MATERIAL',plannerVisible:false,outputQty:2,ingredients:{spiderWeb:10}});
  add('highSilk',{name:'高級絲綢',priority:'S',category:'MATERIAL',plannerVisible:false,outputQty:2,ingredients:{silk:4,strongJuice:8}});

  add('outstandingRecovery',{name:'卓越回復藥水',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:5,note:'藥品製作台 Lv.3｜目前版本最高階直接回復藥水',ingredients:{bloodHerb:16,cleanJuice:5,lifeStone:2}});
  add('outstandingAutoRecovery',{name:'卓越自動回復藥水',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:5,note:'藥品製作台 Lv.3｜自動回復成品',ingredients:{outstandingRecovery:5,gearPart:120}});
  add('ultimatePotion',{name:'終極技秘藥',priority:'S',category:'MEDICINE_BASE',plannerVisible:true,outputQty:3,note:'高級終極技秘藥的前置成品',ingredients:{gritHerb:10,mimiJuice:3,whiteButterfly:6,alchemyShard:10}});
  add('advancedUltimate',{name:'高級終極技秘藥',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'目前版本高階戰鬥秘藥',ingredients:{ultimatePotion:9,cleanJuice:5,ruinStone:1,alchemyShard:20}});
  add('damageReductionPotion',{name:'傷害減免秘藥',priority:'S',category:'MEDICINE_BASE',plannerVisible:true,outputQty:3,note:'高級傷害減免秘藥的前置成品',ingredients:{bloodHerb:10,mimiJuice:3,beetle:6,alchemyShard:10}});
  add('advancedDamageReduction',{name:'高級傷害減免秘藥',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'藥品製作台 Lv.3｜高難內容實用',ingredients:{damageReductionPotion:9,cleanJuice:5,ruinStone:1,alchemyShard:20}});
  add('moveSpeedPotion',{name:'移動速度秘藥',priority:'A',category:'MEDICINE_BASE',plannerVisible:true,outputQty:3,note:'高級移動速度秘藥的前置成品',ingredients:{arrowFlower:10,mimiJuice:3,firefly:6,alchemyShard:10}});
  add('advancedMoveSpeed',{name:'高級移動速度秘藥',priority:'S',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'藥品製作台 Lv.3｜目前版本高階移速藥',ingredients:{moveSpeedPotion:9,cleanJuice:5,ruinStone:1,alchemyShard:20}});
  add('smashEnhancePotion',{name:'強打強化秘藥',priority:'S',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'藥品製作台 Lv.3｜混合強化秘藥前置',ingredients:{bloodHerb:10,cleanJuice:3,beetle:10,alchemyShard:10}});
  add('multiEnhancePotion',{name:'連打強化秘藥',priority:'S',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'藥品製作台 Lv.3｜混合強化秘藥前置',ingredients:{arrowFlower:10,cleanJuice:3,firefly:10,alchemyShard:10}});
  add('aoeEnhancePotion',{name:'範圍強化秘藥',priority:'S',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:3,note:'藥品製作台 Lv.3｜混合強化秘藥前置',ingredients:{magicHerb:10,cleanJuice:3,whiteButterfly:10,alchemyShard:10}});
  add('mixedLandslide',{name:'混合強化秘藥（山崩）',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:2,note:'強打 + 連打｜藥品製作台 Lv.3',ingredients:{smashEnhancePotion:3,multiEnhancePotion:3,potionEmulsifier:6,lifeStone:10,rageFragment:20}});
  add('mixedStorm',{name:'混合強化秘藥（暴風雨）',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:2,note:'強打 + 範圍｜藥品製作台 Lv.3',ingredients:{smashEnhancePotion:3,aoeEnhancePotion:3,potionEmulsifier:6,lifeStone:10,oblivionFragment:20}});
  add('mixedRagingWave',{name:'混合強化秘藥（怒濤）',priority:'S_PLUS',category:'MEDICINE_HIGH',plannerVisible:true,outputQty:2,note:'連打 + 範圍｜藥品製作台 Lv.3',ingredients:{multiEnhancePotion:3,aoeEnhancePotion:3,potionEmulsifier:6,lifeStone:10,wildFragment:20}});

  const topWeapon = (id, cls, ingredients) => add(id,{name:`目前最高階製作武器｜${cls}`,priority:'S_PLUS',category:'WEAPON',plannerVisible:true,outputQty:1,note:'武器製作台 Lv.3｜製作技能 Lv.13；實際武器名稱依遊戲職業顯示',ingredients});
  const weaponCommon = {antiMagicPowder:60,dominanceWeapon:2};
  topWeapon('weaponWarrior','戰士',{specialSteel:5,highWoodPlus:3,...weaponCommon});
  topWeapon('weaponGreatsword','大劍戰士',{specialSteel:5,highWoodPlus:3,...weaponCommon});
  topWeapon('weaponSwordmaster','劍術士',{specialSteel:4,highLeatherPlus:4,...weaponCommon});
  topWeapon('weaponArcher','弓手',{highWoodPlus:5,highLeatherPlus:3,...weaponCommon});
  topWeapon('weaponLongbow','長弓兵',{highWoodPlus:5,highLeatherPlus:3,...weaponCommon});
  topWeapon('weaponCrossbow','弩手',{highWoodPlus:4,specialSteel:4,...weaponCommon});
  topWeapon('weaponMage','魔法師',{highWoodPlus:4,highLeatherPlus:4,...weaponCommon});
  topWeapon('weaponFrost','冰霜術士',{highWoodPlus:4,specialSteel:4,...weaponCommon});
  topWeapon('weaponFire','火焰術士',{specialSteel:5,highWoodPlus:3,...weaponCommon});
  topWeapon('weaponLightning','雷電術士',{specialSteel:5,highLeatherPlus:3,...weaponCommon});
  topWeapon('weaponHealer','治癒師',{highWoodPlus:4,specialSteel:4,...weaponCommon});
  topWeapon('weaponPriest','祭司',{highWoodPlus:4,specialSteel:4,...weaponCommon});
  topWeapon('weaponMonk','修道士',{specialSteel:5,highWoodPlus:3,...weaponCommon});
  topWeapon('weaponBard','吟遊詩人',{highWoodPlus:5,specialSteel:3,...weaponCommon});
  topWeapon('weaponMusician','樂師',{highWoodPlus:5,specialSteel:3,...weaponCommon});
  topWeapon('weaponDancer','舞者',{highWoodPlus:4,specialSteel:4,...weaponCommon});
  topWeapon('weaponThief','盜賊',{specialSteel:4,highLeatherPlus:4,...weaponCommon});
  topWeapon('weaponDualBlade','雙刀客',{specialSteel:5,highLeatherPlus:3,...weaponCommon});
  topWeapon('weaponFighter','格鬥家',{specialSteel:4,highLeatherPlus:4,...weaponCommon});

  add('armorHeavySet',{name:'目前最高階重甲｜5件整套',priority:'S_PLUS',category:'ARMOR',plannerVisible:true,outputQty:1,note:'防具製作台 Lv.3｜重甲製作 Lv.13｜1 = 頭、上衣、手套、下裝、鞋',ingredients:{specialSteel:21,highLeatherPlus:6,highClothPlus:7,highSilk:4,antiMagicPowder:300,dominanceArmor:10}});
  add('armorLightSet',{name:'目前最高階輕甲｜5件整套',priority:'S_PLUS',category:'ARMOR',plannerVisible:true,outputQty:1,note:'防具製作台 Lv.3｜輕甲製作 Lv.13｜1 = 頭、上衣、手套、下裝、鞋',ingredients:{highLeatherPlus:21,specialSteel:6,highClothPlus:7,highSilk:4,antiMagicPowder:300,dominanceArmor:10}});
  add('armorClothSet',{name:'目前最高階布甲｜5件整套',priority:'S_PLUS',category:'ARMOR',plannerVisible:true,outputQty:1,note:'防具製作台 Lv.3｜布甲製作 Lv.13｜1 = 頭、上衣、手套、下裝、鞋',ingredients:{highClothPlus:21,highLeatherPlus:7,specialSteel:6,highSilk:4,antiMagicPowder:300,dominanceArmor:10}});

  add('accessoryNecklace',{name:'目前最高階製作項鍊',priority:'S',category:'ACCESSORY',plannerVisible:true,outputQty:1,note:'多用途製作台 Lv.3｜手工藝 Lv.13',ingredients:{carvedBlueSpinelSS:1,specialSteel:4,antiMagicPowder:60,dominanceAccessory:2}});
  add('accessoryRing',{name:'目前最高階製作戒指',priority:'S',category:'ACCESSORY',plannerVisible:true,outputQty:1,note:'多用途製作台 Lv.3｜手工藝 Lv.13',ingredients:{carvedBlueSpinelSS:1,specialSteel:4,antiMagicPowder:60,dominanceAccessory:2}});
})();
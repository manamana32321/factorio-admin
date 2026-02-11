/**
 * Factorio item/fluid Korean locale mapping.
 * Based on the official Korean locale shipped with the game.
 * Only commonly produced/consumed items are included.
 */

const ITEM_NAMES: Record<string, string> = {
  // Ores & raw
  "iron-ore": "철 광석",
  "copper-ore": "구리 광석",
  "stone": "돌",
  "coal": "석탄",
  "wood": "나무",
  "uranium-ore": "우라늄 광석",
  "raw-fish": "생선",

  // Plates
  "iron-plate": "철판",
  "copper-plate": "구리판",
  "steel-plate": "강철판",

  // Intermediate
  "iron-gear-wheel": "철 톱니바퀴",
  "iron-stick": "철 막대",
  "copper-cable": "구리 선",
  "electronic-circuit": "전자 회로",
  "advanced-circuit": "고급 회로",
  "processing-unit": "처리 장치",
  "engine-unit": "엔진 유닛",
  "electric-engine-unit": "전기 엔진 유닛",
  "flying-robot-frame": "비행 로봇 프레임",
  "battery": "배터리",
  "explosives": "폭약",
  "sulfur": "황",
  "plastic-bar": "플라스틱 막대",
  "sulfuric-acid-barrel": "황산 배럴",
  "empty-barrel": "빈 배럴",
  "low-density-structure": "저밀도 구조물",
  "rocket-fuel": "로켓 연료",
  "rocket-control-unit": "로켓 제어 장치",
  "rocket-part": "로켓 부품",
  "satellite": "인공위성",

  // Science packs
  "automation-science-pack": "자동화 과학 팩",
  "logistic-science-pack": "물류 과학 팩",
  "military-science-pack": "군사 과학 팩",
  "chemical-science-pack": "화학 과학 팩",
  "production-science-pack": "생산 과학 팩",
  "utility-science-pack": "유틸리티 과학 팩",
  "space-science-pack": "우주 과학 팩",

  // Logistics
  "transport-belt": "운송 벨트",
  "fast-transport-belt": "고속 운송 벨트",
  "express-transport-belt": "초고속 운송 벨트",
  "underground-belt": "지하 벨트",
  "fast-underground-belt": "고속 지하 벨트",
  "express-underground-belt": "초고속 지하 벨트",
  "splitter": "분배기",
  "fast-splitter": "고속 분배기",
  "express-splitter": "초고속 분배기",
  "inserter": "삽입기",
  "fast-inserter": "고속 삽입기",
  "long-handed-inserter": "긴 팔 삽입기",
  "bulk-inserter": "대량 삽입기",

  // Production
  "stone-furnace": "석재 용광로",
  "steel-furnace": "강철 용광로",
  "electric-furnace": "전기 용광로",
  "assembling-machine-1": "조립 기계 1",
  "assembling-machine-2": "조립 기계 2",
  "assembling-machine-3": "조립 기계 3",
  "chemical-plant": "화학 공장",
  "oil-refinery": "정유소",
  "lab": "연구소",

  // Power
  "solar-panel": "태양광 패널",
  "accumulator": "축전지",
  "small-electric-pole": "소형 전봇대",
  "medium-electric-pole": "중형 전봇대",
  "big-electric-pole": "대형 전봇대",
  "substation": "변전소",
  "boiler": "보일러",
  "steam-engine": "증기 기관",
  "nuclear-reactor": "원자로",
  "heat-exchanger": "열 교환기",
  "steam-turbine": "증기 터빈",

  // Defense
  "stone-wall": "석재 벽",
  "gun-turret": "건 터렛",
  "laser-turret": "레이저 터렛",
  "radar": "레이더",

  // Ammo
  "firearm-magazine": "소총 탄창",
  "piercing-rounds-magazine": "관통탄 탄창",
  "grenade": "수류탄",
  "rocket": "로켓",

  // Trains
  "rail": "레일",
  "train-stop": "기차역",
  "rail-signal": "철도 신호기",
  "rail-chain-signal": "철도 연쇄 신호기",
  "locomotive": "기관차",
  "cargo-wagon": "화물 차량",
  "fluid-wagon": "유체 차량",

  // Misc
  "pipe": "파이프",
  "pipe-to-ground": "지하 파이프",
  "pump": "펌프",
  "storage-tank": "저장 탱크",
  "offshore-pump": "해상 펌프",
  "small-lamp": "소형 전등",
  "red-wire": "빨간 전선",
  "green-wire": "초록 전선",
  "arithmetic-combinator": "산술 회로",
  "decider-combinator": "결정 회로",
  "constant-combinator": "상수 회로",
  "roboport": "로보포트",
  "logistic-chest-storage": "물류 보관 상자",
  "logistic-chest-passive-provider": "물류 수동 공급 상자",
  "logistic-chest-requester": "물류 요청 상자",
  "logistic-chest-active-provider": "물류 능동 공급 상자",
  "construction-robot": "건설 로봇",
  "logistic-robot": "물류 로봇",
  "repair-pack": "수리 도구",
  "landfill": "매립지",
  "cliff-explosives": "절벽 폭약",
  "concrete": "콘크리트",
  "refined-concrete": "정제 콘크리트",
  "stone-brick": "석재 벽돌",

  // Modules
  "speed-module": "속도 모듈",
  "speed-module-2": "속도 모듈 2",
  "speed-module-3": "속도 모듈 3",
  "efficiency-module": "효율 모듈",
  "efficiency-module-2": "효율 모듈 2",
  "efficiency-module-3": "효율 모듈 3",
  "productivity-module": "생산 모듈",
  "productivity-module-2": "생산 모듈 2",
  "productivity-module-3": "생산 모듈 3",

  // Nuclear
  "uranium-235": "우라늄-235",
  "uranium-238": "우라늄-238",
  "uranium-fuel-cell": "우라늄 연료 전지",
  "used-up-uranium-fuel-cell": "사용된 우라늄 연료 전지",

  // Space Age
  "carbon": "탄소",
  "carbon-fiber": "탄소 섬유",
  "calcite": "방해석",
  "tungsten-ore": "텅스텐 광석",
  "tungsten-carbide": "탄화텅스텐",
  "tungsten-plate": "텅스텐판",
  "holmium-ore": "홀뮴 광석",
  "holmium-plate": "홀뮴판",
  "superconductor": "초전도체",
  "lithium": "리튬",
  "lithium-plate": "리튬판",
  "quantum-processor": "양자 처리 장치",
  "electromagnetic-plant": "전자기 공장",
  "foundry": "주조소",
  "biochamber": "생체 챔버",
  "cryogenic-plant": "극저온 공장",
  "agricultural-tower": "농업 타워",
  "bioflux": "바이오플럭스",
  "ice": "얼음",
  "scrap": "고철",
};

const FLUID_NAMES: Record<string, string> = {
  "water": "물",
  "crude-oil": "원유",
  "heavy-oil": "중유",
  "light-oil": "경유",
  "petroleum-gas": "석유 가스",
  "sulfuric-acid": "황산",
  "lubricant": "윤활유",
  "steam": "증기",
  "fluoroketone-hot": "고온 플루오로케톤",
  "fluoroketone-cold": "저온 플루오로케톤",
  "thruster-fuel": "추력 연료",
  "thruster-oxidizer": "추력 산화제",
  "ammoniacal-solution": "암모니아 용액",
  "lithium-brine": "리튬 염수",
  "holmium-solution": "홀뮴 용액",
  "electrolyte": "전해질",
  "molten-iron": "용철",
  "molten-copper": "용동",
};

const ENTITY_NAMES: Record<string, string> = {
  "small-biter": "소형 바이터",
  "medium-biter": "중형 바이터",
  "big-biter": "대형 바이터",
  "behemoth-biter": "거대 바이터",
  "small-spitter": "소형 스피터",
  "medium-spitter": "중형 스피터",
  "big-spitter": "대형 스피터",
  "behemoth-spitter": "거대 스피터",
  "small-worm-turret": "소형 웜 터렛",
  "medium-worm-turret": "중형 웜 터렛",
  "big-worm-turret": "대형 웜 터렛",
  "behemoth-worm-turret": "거대 웜 터렛",
  "biter-spawner": "바이터 둥지",
  "spitter-spawner": "스피터 둥지",
};

/** Get Korean name for any Factorio internal name. Returns null if no translation. */
export function getKoreanName(internalName: string): string | null {
  return (
    ITEM_NAMES[internalName] ??
    FLUID_NAMES[internalName] ??
    ENTITY_NAMES[internalName] ??
    null
  );
}

/** Format internal name for display (fallback when no Korean name). */
export function formatName(internalName: string): string {
  return getKoreanName(internalName) ?? internalName.replace(/-/g, " ");
}

/**
 * Get wiki icon URL for a Factorio item.
 * Pattern: https://wiki.factorio.com/images/thumb/{Name}.png/32px-{Name}.png
 * Internal name "iron-plate" → wiki name "Iron_plate"
 */
export function getIconUrl(internalName: string): string {
  const wikiName = internalName
    .split("-")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join("_");
  return `https://wiki.factorio.com/images/thumb/${wikiName}.png/32px-${wikiName}.png`;
}

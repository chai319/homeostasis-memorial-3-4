/* Background IDs resolve to original art; weather/time overlays are CSS only. */
(function(g){"use strict";
const available={bg_title:'bg_title.png',bg_science_room:'bg_science_room.png',bg_gym_checkup:'bg_gym_checkup.png',bg_gate_spring:'bg_gate_spring.png',bg_class34:'bg_class34.png',bg_courtyard_stage:'bg_courtyard_stage.png',bg_lake_center:'bg_lake_center.png',bg_camp_kitchen:'bg_camp_kitchen.png',bg_camp_room_night:'bg_camp_room_night.png',bg_lake_sunrise:'bg_lake_sunrise.png'};
const places={lab:'bg_science_room',gate:'bg_gate_spring',classroom:'bg_class34',stage:'bg_courtyard_stage',lake_center:'bg_lake_center',camp_kitchen:'bg_camp_kitchen',camp_room:'bg_camp_room_night',lake_sunrise:'bg_lake_sunrise'};
const aliases={bg_library:'v4_library',library:'v4_library',infirmary:'v4_infirmary',gym:'v4_gym',field:'v4_field',cookroom:'v4_cookroom',roof:'v4_roof',bg_gym_split:'v4_gym',bg_class34_exam:'bg_class34',bg_hallway_board:'v4_corridor',bg_ground_sports:'v4_field',bg_ground_sunset:'bg_ground_sports',bg_staffroom_dusk:'v4_staffroom',bg_class34_escape_open:'bg_class34_escape',bg_class34_escape_night:'bg_class34_escape',bg_class34_rain_craft:'bg_class34',bg_gate_summer:'bg_gate_spring',bg_ground_bonfire:'v4_field',cycling:'bg_date_cycling',planetarium:'bg_date_planetarium',karaoke:'bg_date_karaoke',catcafe:'bg_date_catcafe',oldbooks:'bg_date_usedbooks',bg_date_oldbooks:'bg_date_usedbooks',basketball:'bg_date_basketball',footbath:'bg_date_hotspring',bg_date_footbath:'bg_date_hotspring',farm:'bg_date_ranch',bg_date_farm:'bg_date_ranch',mizuho:'bg_date_mizuho',bg_mizuho:'bg_date_mizuho'};
function register(manifest){for(const a of manifest.assets||[])if(/\.(png|webp)$/.test(a.file))available[a.id]=a.file;}
function resolve(id,{time='',weather=''}={}){
 let key=available[id]?id:places[id]||aliases[id]||id,filter='',overlay=null;if(key==='bg_courtyard_booths'){key='bg_courtyard_stage';overlay='assets/backgrounds/overlay_booths.svg';}if(key==='bg_gate_dusk'){key='bg_gate_spring';filter='dusk';}if(!available[key]){const m=key.match(/^(.*)_(dusk|night|rain|haze)$/);if(m&&available[m[1]]){key=m[1];filter=m[2];}}
 if(!filter){if(weather==='rain')filter='rain';else if(weather==='haze')filter='haze';else if(/夜/.test(time))filter='night';else if(/夕|日没/.test(time))filter='dusk';}
 if(id==='bg_class34_escape_night')filter='night';if(id==='bg_class34_rain_craft')filter='rain';if(id==='bg_staffroom_dusk'||id==='bg_ground_sunset')filter='dusk';if(key==='bg_class34')overlay='assets/backgrounds/overlay_class34.svg';
 return {id:key,src:available[key]?'assets/backgrounds/'+available[key]:null,filter,overlay};
}
const api={resolve,register};g.Ext34Backgrounds=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

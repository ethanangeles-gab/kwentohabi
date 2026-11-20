import type { Chapter, WikiEntry } from '../types';
export const DEMO_TITLE = 'Ang Huling Habi';
export const DEMO_INSTRUCTIONS = 'Fictional demonstration / Kathang-isip na halimbawa. Create an original Filipino-inspired story with an introduction, conflict, climax, resolution, and reflection. Compare the planted age/eye-color details, save perspective notes, and ask the teacher for guidance. Example teacher feedback (not a live assessment): develop the transition from the discovery of the cloth to the village conflict and add dialogue.';
export function demoChapters(): Chapter[] {
  const at = new Date().toISOString();
  return [
    { id:'habi-1', authorId:'maria', title:'Kabanata 1: Ang Hindi Natapos na Tela', at, text:"Amihan lived in Hiraya. Amihan was 12 years old. Amihan's eyes were brown. Sa tabi ng bintana, natagpuan niya ang hindi natapos na telang iniwan ni Lola Sabel. Bawat sinulid ay may kulay ng isang alaala: asul para sa ilog, dilaw para sa ani, at luntian para sa mga punong nagbibigay-lilim. ‘Hindi lamang tela ang hinahabi natin,’ wika ni Lola Sabel. ‘Pinagdurugtong natin ang mga kuwento ng isa't isa.’ Hiniling ni Amihan na matutuhan ang kanilang tradisyon bago tuluyang maglaho ang mga lumang salaysay." },
    { id:'habi-2', authorId:'jose', title:'Kabanata 2: Ang Nawawalang Alaala', at, text:"Amihan was 13 years old. Amihan's eyes were green. Kinabukasan, dinala ni Lira ang balitang isasara ang lumang habihan upang gawing bodega. Nag-alala si Amihan: saan nila ilalagay ang mga kuwento ng kanilang mga ninuno? Sa paghahanap ng sagot, nakausap nila si Mang Isko sa lilim ng punong mangga. May isang bakanteng hibla sa tela, ngunit walang nakaaalala kung ano ang dapat nitong ilarawan. ‘Maaari tayong magkaiba ng alaala,’ sabi ni Lira, ‘at maaari pa rin tayong makinig.’ Nagsimula silang magtanong sa bawat tahanan sa Sitio Hiraya." },
    { id:'habi-3', authorId:'ana', title:'Kabanata 3: Ang Kuwento ng Pamayanan', at, text:"Nang sumapit ang hapon, bumalik ang magkakaibigan sa habihan. Ikinuwento ni Mang Isko ang unang pagtutulungan ng mga pamilya matapos umapaw ang ilog. Ang nawawalang hibla pala ay para sa mga kamay na sama-samang bumuo ng bagong tahanan. Tinipon ni Amihan ang iba't ibang bersyon at isinulat kung sino ang pinagmulan ng bawat alaala. Hindi niya binura ang pagkakaiba; tinanong niya kung saan ito nagmula. Kasama si Lola Sabel at Lira, nakabuo sila ng eksibisyon na nagbigay ng bagong gamit sa habihan bilang silid ng mga kuwento. Napagtanto ni Amihan na buhay ang tradisyon kapag naibabahagi at naipagpapatuloy ito ng pamayanan." },
  ];
}
export function demoWiki(teacherId: string): WikiEntry[] {
  const updatedAt = new Date().toISOString();
  return [
    {id:'demo-amihan',category:'character',name:'Amihan',description:'Curious young learner preserving the stories of Sitio Hiraya.',details:'Role: main character. Relationships: granddaughter of Lola Sabel; friend of Lira. Important event: discovers the unfinished cloth.',chapterIds:['habi-1','habi-2','habi-3'],createdBy:teacherId,updatedAt},
    {id:'demo-hiraya',category:'location',name:'Sitio Hiraya',description:'A fictional weaving community.',details:'The old weaving house becomes a room for community stories. This is original demonstration content.',chapterIds:['habi-1','habi-3'],createdBy:teacherId,updatedAt},
    {id:'demo-cloth',category:'object',name:'Ang hindi natapos na tela',description:'A cloth whose threads preserve community memories.',details:'Story rule: a thread represents a memory; perspectives are attributed to their storytellers.',chapterIds:['habi-1','habi-3'],createdBy:teacherId,updatedAt},
  ];
}

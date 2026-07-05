import type { Card } from './types'

export const cards: Card[] = [
 {id:'chakchouka',title:'Chakchouka',description:"Plat maghrébin mijoté à base de tomates, poivrons et œufs.",image:'/cards/chakchouka.jpg',rarity:'L',atk:6997,def:4339,owned:0,wanted:true,contacts:['Élise Martin','Thomas Bernard','Sofia Rossi'],category:'Cuisine'},
 {id:'tasmanie',title:'Tasmanie',description:"État insulaire d’Australie connu pour sa nature sauvage.",image:'/cards/tasmanie.jpg',rarity:'UR',atk:8599,def:7653,owned:0,wanted:true,contacts:['Thomas Bernard','Maya'],category:'Géographie'},
 {id:'gino-bartali',title:'Gino Bartali',description:'Coureur cycliste italien, double vainqueur du Tour de France.',image:'/cards/gino-bartali.jpg',rarity:'SR',atk:7500,def:9481,owned:1,wanted:false,contacts:['Élise Martin','Léo'],category:'Sport'},
 {id:'geena-davis',title:'Geena Davis',description:'Actrice américaine et militante pour l’égalité des genres.',image:'/cards/geena-davis.jpg',rarity:'SR',atk:8507,def:4447,owned:0,wanted:true,contacts:['Sofia Rossi'],category:'Cinéma'},
 {id:'jupiter-li',title:'Jupiter LI',description:'Satellite naturel externe de Jupiter découvert en 2010.',image:'/cards/jupiter-li.jpg',rarity:'L',atk:7670,def:6330,owned:0,wanted:false,contacts:['Maya','Léo'],category:'Astronomie'},
 {id:'rocky-balboa',title:'Rocky Balboa',description:'Personnage de fiction interprété par Sylvester Stallone.',image:'/cards/rocky-balboa.jpg',rarity:'UR',atk:6792,def:5276,owned:2,wanted:false,contacts:['Thomas Bernard'],category:'Cinéma'},
 {id:'parthenon',title:'Le Parthénon',description:"Temple dédié à Athéna sur l’Acropole d’Athènes.",image:'/cards/parthenon.jpg',rarity:'SR',atk:7210,def:6110,owned:1,wanted:false,contacts:[],category:'Architecture'},
 {id:'marie-curie',title:'Marie Curie',description:'Physicienne et chimiste, pionnière de la radioactivité.',image:'/cards/marie-curie.jpg',rarity:'R',atk:6400,def:5700,owned:0,wanted:true,contacts:['Élise Martin'],category:'Sciences'},
 {id:'pyramides',title:'Pyramides de Gizeh',description:'Ensemble monumental funéraire de l’Égypte antique.',image:'/cards/pyramides.jpg',rarity:'R',atk:5890,def:7740,owned:1,wanted:false,contacts:[],category:'Histoire'},
 {id:'colibri',title:'Colibri',description:'Famille d’oiseaux remarquables par leur vol stationnaire.',image:'/cards/colibri.jpg',rarity:'PC',atk:3210,def:2890,owned:3,wanted:false,contacts:['Maya'],category:'Nature'},
 {id:'machu-picchu',title:'Machu Picchu',description:'Ancienne cité inca perchée dans les Andes péruviennes.',image:'/cards/machu-picchu.jpg',rarity:'PC',atk:3550,def:4920,owned:0,wanted:true,contacts:['Léo','Sofia Rossi'],category:'Histoire'},
 {id:'joconde',title:'La Joconde',description:'Portrait peint par Léonard de Vinci au XVIe siècle.',image:'/cards/joconde.jpg',rarity:'C',atk:1930,def:4810,owned:4,wanted:false,contacts:[],category:'Art'},
]

export const contacts = [
 {name:'Élise Martin', initials:'EM', count:1284, online:true},
 {name:'Thomas Bernard', initials:'TB', count:932, online:true},
 {name:'Sofia Rossi', initials:'SR', count:2106, online:false},
 {name:'Maya', initials:'MY', count:745, online:true},
 {name:'Léo', initials:'LÉ', count:1518, online:false},
]

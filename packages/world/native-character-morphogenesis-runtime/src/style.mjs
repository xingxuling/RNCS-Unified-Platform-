import {rootHash,seal} from './canonical.mjs';

const DEFAULT_STYLE={format:'rncs.anime-forge-render-style.v0.1',profile:'anime-npr-clean-v0.1',palette:{skin:'#e7c9b8',skin_shadow:'#bb8e82',hair:'#111923',hair_light:'#6e879b',ink:'#14202b',coat:'#1d3553',coat_dark:'#12223a',trim:'#c6d7de',eye:'#4f86c6',mouth_inner:'#9b5963',sky_top:'#dbe7eb',sky_bottom:'#8e9da8',building:'#687984',platform:'#455764',platform_line:'#98aab1',shadow:'#18232e'},line_widths:{default:4,face:3,jaw:2,garment:4,feature:3}};

export function createRenderStyle(input={}){const style={...DEFAULT_STYLE,...input,palette:{...DEFAULT_STYLE.palette,...input.palette},line_widths:{...DEFAULT_STYLE.line_widths,...input.line_widths}};return seal(style,'style_root');}

const materialStyle={skin:{fill:'skin',stroke:'ink',width:'default'},'skin-shadow':{fill:'skin_shadow',stroke:'ink',width:'default'},hair:{fill:'hair',stroke:'ink',width:'garment'},coat:{fill:'coat',stroke:'ink',width:'garment'},body:{fill:'coat_dark',stroke:'ink',width:'garment'},eye:{fill:'eye',stroke:'ink',width:'feature'},ink:{fill:null,stroke:'ink',width:'feature'},'mouth-inner':{fill:'mouth_inner',stroke:'ink',width:'feature'}};

export function applyAnimeStyle(projectedFrameGeometry,styleInput={}){
  const style=createRenderStyle(styleInput),primitives=(projectedFrameGeometry?.primitives??[]).map(item=>{const material=materialStyle[item.material]??materialStyle.ink;return{...item,fill:material.fill?style.palette[material.fill]:null,stroke:style.palette[material.stroke]??style.palette.ink,line_width:style.line_widths[material.width]??style.line_widths.default};});
  return seal({...projectedFrameGeometry,style_root:style.style_root,style,primitives,style_policy:'style-after-camera-projection'},'styled_root');
}


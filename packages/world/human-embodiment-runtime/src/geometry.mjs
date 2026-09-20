import {cross2,distance2} from './math.mjs';

export function convexHull(points){
  const pts=[...points].map(p=>[p[0],p[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  if(pts.length<=2) return pts;
  const lower=[]; for(const p of pts){while(lower.length>=2&&cross2([lower.at(-1)[0]-lower.at(-2)[0],lower.at(-1)[1]-lower.at(-2)[1]],[p[0]-lower.at(-1)[0],p[1]-lower.at(-1)[1]])<=0) lower.pop(); lower.push(p)}
  const upper=[]; for(const p of pts.reverse()){while(upper.length>=2&&cross2([upper.at(-1)[0]-upper.at(-2)[0],upper.at(-1)[1]-upper.at(-2)[1]],[p[0]-upper.at(-1)[0],p[1]-upper.at(-1)[1]])<=0) upper.pop(); upper.push(p)}
  lower.pop(); upper.pop(); return lower.concat(upper);
}

export function pointInPolygon(point,poly){
  if(poly.length<3) return poly.some(p=>distance2(p,point)<1e-6);
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    const hit=((yi>point[1])!==(yj>point[1]))&&(point[0]<(xj-xi)*(point[1]-yi)/(yj-yi+1e-12)+xi);
    if(hit) inside=!inside;
  }
  return inside;
}

function pointSegDistance(p,a,b){
  const vx=b[0]-a[0],vy=b[1]-a[1],wx=p[0]-a[0],wy=p[1]-a[1];
  const vv=vx*vx+vy*vy; const t=vv<1e-12?0:Math.max(0,Math.min(1,(wx*vx+wy*vy)/vv));
  return Math.hypot(p[0]-(a[0]+t*vx),p[1]-(a[1]+t*vy));
}
export function polygonMargin(point,poly){
  if(!poly.length) return -Infinity;
  if(poly.length===1) return -distance2(point,poly[0]);
  let d=Infinity; for(let i=0;i<poly.length;i++) d=Math.min(d,pointSegDistance(point,poly[i],poly[(i+1)%poly.length]));
  return pointInPolygon(point,poly)?d:-d;
}

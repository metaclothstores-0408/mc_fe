/**
 * DTF client-side preprocessing middleware.
 * Isolated pipeline: hidden canvas, no 3D disruption.
 *
 * Sheet presets — physical DTF frames (garment-size invariant at 300 DPI):
 *  A4 = 8.3×11.7" (2490×3510 px) pocket / small
 *  A3 = 11.7×16.5" (3510×4950 px) chest/back
 */
export const SHEET_PRESETS = {
  A4: { id: "A4", label: "A4 Sheet (Pocket / Small Print)", widthInches: 8.3, heightInches: 11.7, widthPx300: 2490, heightPx300: 3510 },
  A3: { id: "A3", label: "A3 Sheet (Standard Chest / Back Print)", widthInches: 11.7, heightInches: 16.5, widthPx300: 3510, heightPx300: 4950 },
};
export const DEFAULT_SHEET = "A3";
const DPI = 300;
export function getSheetPreset(id){ return SHEET_PRESETS[id] || SHEET_PRESETS[DEFAULT_SHEET]; }
/** Garment-size invariant: S–XXL press same physical transfer. occupancy=printScale/2 → 1.0 = 50% of sheet (A3→5.85"). */
export function computePrintWidthInches(sheetPresetId, printScale){
  const sh=getSheetPreset(sheetPresetId); const s=Math.max(0.4,Math.min(4.0,Number(printScale)||1));
  return Math.round(sh.widthInches * (s/2) * 100)/100;
}
export function computePixelDimsForSheet(sheetPresetId, printScale, srcW, srcH){
  const wIn=computePrintWidthInches(sheetPresetId,printScale); const wPx=Math.round(wIn*DPI);
  if(srcW&&srcH){ const asp=srcW/srcH; return { widthInches:wIn, widthPx:wPx, heightPx:Math.round(wPx/asp), dpi:DPI }; }
  return { widthInches:wIn, widthPx:wPx, heightPx:null, dpi:DPI };
}
export function inchesToPixels(inches){ return Math.round(Number(inches)*DPI); }


function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map(function(c){return c+c;}).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function colorDistance(r1,g1,b1,r2,g2,b2){
  var dr=r1-r2,dg=g1-g2,db=b1-b2;
  return Math.sqrt(dr*dr+dg*dg+db*db);
}
export function hueToHex(hue){
  var h=((hue%360)+360)%360;
  var c=1,x=c*(1-Math.abs(((h/60)%2)-1)),m=-0.5;
  var r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  function toHex(v){return Math.round((v+m)*255).toString(16).padStart(2,"0");}
  return "#"+toHex(r)+toHex(g)+toHex(b);
}
export function hexToHue(hex){
  var rgb=hexToRgb(hex); if(!rgb) return 0;
  var r=rgb.r/255,g=rgb.g/255,b=rgb.b/255;
  var max=Math.max(r,g,b),min=Math.min(r,g,b);
  if(max===min) return 0;
  var d=max-min,h=0;
  if(max===r) h=((g-b)/d)%6; else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  h*=60; if(h<0) h+=360; return Math.round(h);
}
function loadImage(url){
  return new Promise(function(resolve,reject){
    if(url.indexOf("data:")===0){
      var img=new Image();
      img.onload=function(){resolve({img:img,revoke:null});};
      img.onerror=reject; img.src=url; return;
    }
    fetch(url,{mode:"cors"}).then(function(r){
      if(!r.ok) throw new Error("fetch "+r.status);
      return r.blob();
    }).then(function(blob){
      var objectUrl=URL.createObjectURL(blob);
      var img2=new Image();
      img2.crossOrigin="anonymous";
      img2.onload=function(){ resolve({img:img2,revoke:function(){URL.revokeObjectURL(objectUrl);}}); };
      img2.onerror=function(e){ URL.revokeObjectURL(objectUrl); reject(e); };
      img2.src=objectUrl;
    }).catch(reject);
  });
}
export function validateHex(hex){
  if(!hex) return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(String(hex).trim());
}

/**
 * Main entry: hidden canvas chroma-key + Bayer halftone preview.
 * @param {string|null} sourceUrl original asset URL / dataURL
 * @param {{stripColorHex:string, stripSensitivity:number, halftoneDensity:number}} opts
 * @returns {Promise<string|null>} PNG dataURL with transparency
 */
export async function processDtfImage(sourceUrl, opts){
  opts = opts || {};
  if(!sourceUrl) return null;
  var stripHex = opts.stripColorHex || "#ffffff";
  var sensitivity = Math.max(0, Math.min(100, Number(opts.stripSensitivity!=null?opts.stripSensitivity:30)));
  var halftoneDensity = Math.max(0, Math.min(100, Number(opts.halftoneDensity!=null?opts.halftoneDensity:0)));
  var target = hexToRgb(stripHex);
  var maxDist = 441.67295;
  var tolerance = (sensitivity/100)*maxDist;
  var loaded;
  try{ loaded = await loadImage(sourceUrl); } catch(e){ return null; }
  var img = loaded.img, revoke = loaded.revoke;
  var w = img.naturalWidth||img.width, h = img.naturalHeight||img.height;
  if(!w||!h){ if(revoke) revoke(); return null; }
  var MAX_PREVIEW = 1024;
  var cw = w, ch = h;
  if(Math.max(w,h) > MAX_PREVIEW){ var s = MAX_PREVIEW/Math.max(w,h); cw=Math.round(w*s); ch=Math.round(h*s); }
  var canvas = document.createElement("canvas");
  canvas.width=cw; canvas.height=ch;
  var ctx = canvas.getContext("2d");
  if(!ctx){ if(revoke) revoke(); return null; }
  ctx.clearRect(0,0,cw,ch);
  ctx.drawImage(img,0,0,cw,ch);
  if(revoke) revoke();
  var imageData = ctx.getImageData(0,0,cw,ch);
  var data = imageData.data;
  // Bayer 4x4 0..15
  var bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(var i=0;i<data.length;i+=4){
    var r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
    if(a===0) continue;
    if(target){
      var dist=colorDistance(r,g,b,target.r,target.g,target.b);
      if(dist <= tolerance){ data[i+3]=0; continue; }
      var featherBand=maxDist*0.04;
      if(dist < tolerance+featherBand && tolerance>0){
        var fade=(dist-tolerance)/featherBand;
        if(fade<0) fade=0; if(fade>1) fade=1;
        data[i+3]=Math.round(a*fade);
        if(fade<0.5) continue;
      }
    }
    if(halftoneDensity>0 && data[i+3]>20){
      var gray=(0.299*r+0.587*g+0.114*b)/255;
      var idx=i/4, x=idx%cw, y=Math.floor(idx/cw);
      var bayerVal=bayer[(y%4)*4+(x%4)]/16;
      var blend=halftoneDensity/100;
      var threshold=bayerVal*(0.55+blend*0.45)+(1-blend)*0.15;
      if(gray>0.35 && gray<0.92 && gray < threshold+blend*0.15){
        var holeStrength = blend*(gray>0.6?1:0.6);
        data[i+3]=Math.round(data[i+3]*(1-holeStrength*0.85));
      }
    }
  }
  ctx.putImageData(imageData,0,0);
  return canvas.toDataURL("image/png");
}


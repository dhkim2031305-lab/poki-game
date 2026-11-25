import sys, os, re, base64, json
root=sys.argv[1]; out=sys.argv[2]
html=open(os.path.join(root,'index.html'),encoding='utf-8').read()
mime={'.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'}
assets={}
for dp,_,fs in os.walk(os.path.join(root,'assets')):
    for f in fs:
        ext=os.path.splitext(f)[1].lower()
        if ext not in mime: continue
        p=os.path.join(dp,f); rel=os.path.relpath(p,root).replace(os.sep,'/')
        assets[rel]='data:%s;base64,%s'%(mime[ext],base64.b64encode(open(p,'rb').read()).decode())
shim="<script>window.__A=%s;(function(){var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{get:function(){return d.get.call(this)},set:function(v){var k=String(v).replace(/^\\.\\//,'');d.set.call(this,window.__A[k]||v)},configurable:true});})();</script>"%json.dumps(assets)
def css(m):
    href=m.group(1); return '<style>'+open(os.path.join(root,href),encoding='utf-8').read()+'</style>'
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',css,html)
def js(m):
    src=m.group(1)
    if src.startswith('http'): return m.group(0)
    code=open(os.path.join(root,src),encoding='utf-8').read().replace('</script','<\\/script')
    return '<script>'+code+'</script>'
html=re.sub(r'<script src="([^"]+)"></script>',js,html)
html=html.replace('<head>','<head>'+shim,1) if '<head>' in html else shim+html
open(out,'w',encoding='utf-8').write(html)
print(len(assets),'assets', round(os.path.getsize(out)/1024/1024,2),'MB')

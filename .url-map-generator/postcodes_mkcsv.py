import json, csv, collections
L=json.load(open('lvl.json')); A=json.load(open('abs/poa_agg.json'))
au=collections.defaultdict(list)
for r in csv.DictReader(open('abs/aupc.csv',encoding='utf-8')):
    if r['state']=='VIC': au[r['postcode']].append(r)
out='/workspace/ventures/niche-sites/household-rebates/postcodes.csv'
w=csv.writer(open(out,'w',newline=''))
w.writerow(['postcode','veu_area','reticulated_gas','veu_climatic_region','heat_pump_zone','localities','primary_lga','primary_lga_share_pct','other_lgas','dwellings_2021','lga_locality_source','notes'])
fb=0
def clean(n): return n.replace(' (Vic.)','')
for p in sorted(L, key=int):
    area,gas,clim,hp=L[p]
    a=A.get(p)
    if a and a['dw']>0:
        tot=sum(c for n,c in a['lga'])
        lg=[(clean(n),c/tot*100) for n,c in a['lga'] if n!='?']
        prim=lg[0]; others='; '.join(f'{n} ({s:.0f}%)' for n,s in lg[1:] if s>=0.5)
        locs='; '.join(clean(n) for n,c in a['sal'][:10] if n!='?' and c>=1)
        src='ABS ASGS Ed.3 mesh block allocation (POA 2021, SAL 2021, LGA 2025) weighted by 2021 Census dwellings'
        w.writerow([p,area,gas,clim,hp,locs,prim[0],f'{prim[1]:.0f}',others,int(a['dw']),src,''])
    else:
        rows=au.get(p,[]); fb+=1
        locs='; '.join(sorted({r['locality'].title() for r in rows}))
        lgas=collections.Counter(r['lgaregion'] for r in rows if r['lgaregion'])
        prim=lgas.most_common(1)[0][0] if lgas else ''
        others='; '.join(n for n,c in lgas.most_common()[1:])
        typ='; '.join(sorted({r['type'] for r in rows if r['type']}))
        w.writerow([p,area,gas,clim,hp,locs,prim,'',others,0,'Community dataset matthewproctor/australianpostcodes (no ABS residential mesh blocks)',f'PO box / non-residential postcode ({typ or "type n/a"}); LGA indicative'])
print('rows',len(L),'fallback',fb)

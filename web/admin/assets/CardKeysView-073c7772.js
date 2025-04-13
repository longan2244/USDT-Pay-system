import{r as h,q as le,x as ae,g as r,e as z,h as se,o as u,c as d,a as t,k as D,i as b,w as x,t as y,b as K,l as oe,m as v,v as _,F as M,j as V,p as S,s as R,y as re}from"./index-e339bdcb.js";import{_ as ie,a as ue,g as de}from"./Pagination-0226a04b.js";import{_ as ne}from"./DataTable-3636bea7.js";import{M as q}from"./ModalDialog-cb5c6411.js";function ve(c){return h({url:"/admin/card-keys",method:"get",params:c})}function ce(c){return h({url:"/admin/add-card-key",method:"post",data:c})}function pe(c){return h({url:`/admin/card-keys/${c}`,method:"delete"})}function me(c){return h({url:"/admin/card-keys/batch-delete",method:"post",data:c})}const ye={class:"cardkeys-page"},fe={class:"filter-row"},ge={class:"filter-item"},be={class:"filter-item"},he=["value"],ke={class:"filter-item"},we={class:"data-card"},Ce={key:0,class:"batch-actions"},Ie={class:"modal-form"},De={class:"form-group"},xe=["value"],Ke={class:"form-group"},_e={class:"radio-group"},Me={class:"radio-label"},Ve={class:"radio-label"},Se={key:0,class:"form-group"},Ae={class:"form-group"},Pe={class:"checkbox-group"},Ue={class:"checkbox-label"},Ne={class:"form-group"},$e=["placeholder"],Fe={class:"modal-form"},ze={class:"preview-header"},Re={class:"preview-list"},qe={key:0,class:"empty-preview"},Be={key:1,class:"preview-items"},He={__name:"CardKeysView",setup(c){const{showNotification:n}=le(),B=ae(),A=r([]),k=r([]),p=r([]);r({});const o=r({status:"all",productId:"",search:""}),i=r({page:1,pageSize:10,totalItems:0,totalPages:0}),w=r(!1),T=r("添加卡密"),C=r(!1),L=r("卡密预览"),a=r({productId:"",keys:"",delimiter:"#",useDelimiter:!1,removeDuplicates:!1}),f=r([]),I=r(!1),P=l=>l?new Date(l).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"-",j=[{text:"ID",value:"id",formatter:l=>l.substring(0,8)+"..."},{text:"卡密",value:"key",style:{flex:"2"}},{text:"商品",value:"productName"},{text:"状态",value:"status",type:"status",formatter:(l,e)=>({status:e.orderId?"used":"available",text:e.orderId?"已使用":"可用"})},{text:"创建时间",value:"createdAt",formatter:P},{text:"使用时间",value:"usedAt",formatter:l=>l?P(l):"-"},{text:"操作",value:"actions",type:"actions",actions:[{action:"delete",icon:"ri-delete-bin-line",condition:l=>!l.orderId}]}],E=z(()=>p.value.length>0),g=z(()=>k.value.filter(l=>l.status==="active")),m=async()=>{I.value=!0;try{const l={page:i.value.page,pageSize:i.value.pageSize};o.value.status&&o.value.status!=="all"&&(l.status=o.value.status),o.value.productId&&(l.productId=o.value.productId),o.value.search&&(l.search=o.value.search);const e=await ve(l);A.value=e.data,e.pagination&&(i.value={...i.value,...e.pagination})}catch(l){console.error("获取卡密列表失败:",l)}finally{I.value=!1}},H=async()=>{try{const e=await de({pageSize:100,status:"active"});k.value=e.data;const s=B.query.productId;s&&(o.value.productId=s,U()),g.value.length>0&&!a.value.productId&&(a.value.productId=g.value[0].id)}catch(l){console.error("获取商品列表失败:",l)}},G=()=>{i.value.page=1,m()},U=()=>{i.value.page=1,m()},J=()=>{o.value={status:"all",productId:"",search:""},i.value.page=1,m()},O=l=>{i.value.page=l,m()},Q=({action:l,item:e})=>{l==="delete"&&ee(e)},W=()=>{if(g.value.length===0){n("error","无法添加卡密","请先添加商品");return}a.value={productId:g.value[0].id,keys:"",delimiter:"#",useDelimiter:!1,removeDuplicates:!1},f.value=[],w.value=!0},N=()=>{w.value=!1},$=()=>{C.value=!1},X=async()=>{await Z()},Y=()=>{if(!a.value.keys.trim()){n("error","预览失败","请输入卡密内容");return}let l=[];if(a.value.useDelimiter){const e=a.value.delimiter||"#";l=a.value.keys.split(e)}else l=a.value.keys.split(`
`);l=l.map(e=>e.trim()).filter(e=>e),a.value.removeDuplicates&&(l=[...new Set(l)]),f.value=l,C.value=!0},Z=async()=>{if(!a.value.productId||!a.value.keys.trim()){n("error","提交失败","请填写完整的卡密信息");return}try{const l={productId:a.value.productId,keys:a.value.keys,removeDuplicates:a.value.removeDuplicates};a.value.useDelimiter&&a.value.delimiter&&(l.delimiter=a.value.delimiter),await ce(l),n("success","添加成功","卡密已成功添加"),N(),m()}catch(l){console.error("添加卡密失败:",l),n("error","添加失败",l.message||"添加卡密时发生错误")}},ee=async l=>{try{await pe(l.id);const e=p.value.findIndex(s=>s.id===l.id);e!==-1&&p.value.splice(e,1),n("success","删除成功","卡密已成功删除"),m()}catch(e){console.error("删除卡密失败:",e),n("error","删除失败",e.message||"删除卡密时发生错误")}},te=async()=>{if(p.value.length===0){n("warning","请选择卡密","请先选择要删除的卡密");return}try{const l=p.value.map(e=>e.id);await me({ids:l}),n("success","批量删除成功",`已成功删除 ${p.value.length} 个卡密`),p.value=[],m()}catch(l){console.error("批量删除卡密失败:",l),n("error","批量删除失败",l.message||"批量删除卡密时发生错误")}};return se(()=>{m(),H()}),(l,e)=>(u(),d("div",ye,[t("div",{class:"page-header"},[e[11]||(e[11]=t("h2",null,"卡密管理",-1)),t("div",{class:"header-actions"},[t("button",{class:"btn-primary",onClick:W},e[9]||(e[9]=[t("i",{class:"ri-add-line"},null,-1),D(" 添加卡密 ")])),t("button",{class:"btn-secondary",onClick:G},e[10]||(e[10]=[t("i",{class:"ri-refresh-line"},null,-1),D(" 刷新 ")]))])]),b(ie,{onReset:J,onApply:U},{default:x(()=>[t("div",fe,[t("div",ge,[e[13]||(e[13]=t("label",null,"卡密状态",-1)),v(t("select",{"onUpdate:modelValue":e[0]||(e[0]=s=>o.value.status=s),class:"select-input"},e[12]||(e[12]=[t("option",{value:"all"},"全部卡密",-1),t("option",{value:"available"},"可用卡密",-1),t("option",{value:"used"},"已使用",-1)]),512),[[_,o.value.status,void 0,{trim:!0}]])]),t("div",be,[e[15]||(e[15]=t("label",null,"商品",-1)),v(t("select",{"onUpdate:modelValue":e[1]||(e[1]=s=>o.value.productId=s),class:"select-input"},[e[14]||(e[14]=t("option",{value:""},"全部商品",-1)),(u(!0),d(M,null,V(k.value,s=>(u(),d("option",{key:s.id,value:s.id},y(s.name),9,he))),128))],512),[[_,o.value.productId,void 0,{trim:!0}]])]),t("div",ke,[e[16]||(e[16]=t("label",null,"搜索",-1)),v(t("input",{type:"text","onUpdate:modelValue":e[2]||(e[2]=s=>o.value.search=s),class:"form-input",placeholder:"卡密/商品名称"},null,512),[[S,o.value.search,void 0,{trim:!0}]])])])]),_:1}),t("div",we,[E.value?(u(),d("div",Ce,[t("button",{class:"btn-danger",onClick:te},[e[17]||(e[17]=t("i",{class:"ri-delete-bin-line"},null,-1)),D(" 批量删除 ("+y(p.value.length)+") ",1)])])):K("",!0),b(ne,{headers:j,data:A.value,loading:I.value,"empty-text":"没有找到卡密","empty-icon":"ri-key-line",onRowAction:Q},null,8,["data","loading"]),i.value.totalPages>1?(u(),oe(ue,{key:1,page:i.value.page,"total-pages":i.value.totalPages,"total-items":i.value.totalItems,onPageChange:O},null,8,["page","total-pages","total-items"])):K("",!0)]),b(q,{show:w.value,title:T.value,"modal-type":"addCardKey",onClose:N,onSubmit:X},{default:x(()=>[t("div",Ie,[t("div",De,[e[18]||(e[18]=t("label",null,"选择商品",-1)),v(t("select",{"onUpdate:modelValue":e[3]||(e[3]=s=>a.value.productId=s),class:"form-input"},[(u(!0),d(M,null,V(g.value,s=>(u(),d("option",{key:s.id,value:s.id},y(s.name),9,xe))),128))],512),[[_,a.value.productId,void 0,{trim:!0}]])]),t("div",Ke,[e[21]||(e[21]=t("label",null,"分割方式",-1)),t("div",_e,[t("label",Me,[v(t("input",{type:"radio","onUpdate:modelValue":e[4]||(e[4]=s=>a.value.useDelimiter=s),value:!1},null,512),[[R,a.value.useDelimiter]]),e[19]||(e[19]=t("span",null,"换行分割",-1))]),t("label",Ve,[v(t("input",{type:"radio","onUpdate:modelValue":e[5]||(e[5]=s=>a.value.useDelimiter=s),value:!0},null,512),[[R,a.value.useDelimiter]]),e[20]||(e[20]=t("span",null,"自定义分隔符",-1))])])]),a.value.useDelimiter?(u(),d("div",Se,[e[22]||(e[22]=t("label",null,"分隔符",-1)),v(t("input",{type:"text","onUpdate:modelValue":e[6]||(e[6]=s=>a.value.delimiter=s),class:"form-input",placeholder:"请输入分隔符，默认为#"},null,512),[[S,a.value.delimiter,void 0,{trim:!0}]])])):K("",!0),t("div",Ae,[e[24]||(e[24]=t("label",null,"去重",-1)),t("div",Pe,[t("label",Ue,[v(t("input",{type:"checkbox","onUpdate:modelValue":e[7]||(e[7]=s=>a.value.removeDuplicates=s)},null,512),[[re,a.value.removeDuplicates]]),e[23]||(e[23]=t("span",null,"自动去除重复卡密",-1))])])]),t("div",Ne,[e[25]||(e[25]=t("label",null,"卡密",-1)),v(t("textarea",{"onUpdate:modelValue":e[8]||(e[8]=s=>a.value.keys=s),class:"form-textarea",placeholder:a.value.useDelimiter?`请输入卡密，使用 ${a.value.delimiter||"#"} 分割多个卡密`:"请输入卡密，多个卡密请换行输入"},null,8,$e),[[S,a.value.keys,void 0,{trim:!0}]])]),t("div",{class:"form-actions"},[t("button",{class:"btn-secondary",onClick:Y},"预览分割结果")])])]),_:1},8,["show","title"]),b(q,{show:C.value,title:L.value,"modal-type":"previewCardKeys",onClose:$,onSubmit:$},{default:x(()=>[t("div",Fe,[t("div",ze,[t("h3",null,"卡密预览 (共 "+y(f.value.length)+" 个)",1)]),t("div",Re,[f.value.length===0?(u(),d("div",qe,e[26]||(e[26]=[t("p",null,"没有有效的卡密",-1)]))):(u(),d("div",Be,[(u(!0),d(M,null,V(f.value,(s,F)=>(u(),d("div",{key:F,class:"preview-item"},[t("span",null,y(F+1)+". "+y(s),1)]))),128))]))])])]),_:1},8,["show","title"])]))}};export{He as default};

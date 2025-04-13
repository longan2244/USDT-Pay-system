import{r as f,o as m,c as b,a as s,t as u,d as v,k as p,e as h,b as k}from"./index-e339bdcb.js";function S(e){return f({url:"/admin/products",method:"get",params:e})}function A(e){return f({url:"/admin/products",method:"post",data:e})}function T(e,o){return f({url:`/admin/products/${e}`,method:"put",data:o})}const $={class:"filter-card"},x={class:"filter-header"},C={class:"filter-body"},D={__name:"FilterCard",props:{title:{type:String,default:"过滤条件"}},emits:["reset","apply"],setup(e,{emit:o}){const n=o,g=()=>{n("reset")},l=()=>{n("apply")};return(a,t)=>(m(),b("div",$,[s("div",x,[s("h3",null,u(e.title),1),s("button",{class:"btn-text",onClick:g},"重置")]),s("div",C,[v(a.$slots,"default"),s("div",{class:"filter-row"},[s("div",{class:"filter-item filter-actions"},[s("button",{class:"btn-primary",onClick:l},t[0]||(t[0]=[s("i",{class:"ri-search-line"},null,-1),p(" 搜索 ")]))])])])]))}},N={class:"pagination"},V=["disabled"],w=["disabled"],q={class:"pagination-info"},B={key:0},F=["disabled"],I=["disabled"],E={__name:"Pagination",props:{page:{type:Number,required:!0},totalPages:{type:Number,required:!0},totalItems:{type:Number,default:0},maxVisiblePages:{type:Number,default:5}},emits:["page-change"],setup(e,{emit:o}){const n=e,g=o;h(()=>{const{page:a,totalPages:t,maxVisiblePages:i}=n;if(t<=i)return Array.from({length:t},(y,c)=>c+1);const P=Math.floor(i/2);let r=Math.max(a-P,1),d=r+i-1;return d>t&&(d=t,r=Math.max(d-i+1,1)),Array.from({length:d-r+1},(y,c)=>r+c)});const l=a=>{a<1||a>n.totalPages||a===n.page||g("page-change",a)};return(a,t)=>(m(),b("div",N,[s("button",{class:"pagination-btn",onClick:t[0]||(t[0]=i=>l(1)),disabled:e.page===1,title:"第一页"},t[4]||(t[4]=[s("i",{class:"ri-arrow-left-double-line"},null,-1)]),8,V),s("button",{class:"pagination-btn",onClick:t[1]||(t[1]=i=>l(e.page-1)),disabled:e.page===1,title:"上一页"},t[5]||(t[5]=[s("i",{class:"ri-arrow-left-s-line"},null,-1)]),8,w),s("div",q,[p(u(e.page)+" / "+u(e.totalPages)+" ",1),e.totalItems>0?(m(),b("span",B,"(共 "+u(e.totalItems)+" 条)",1)):k("",!0)]),s("button",{class:"pagination-btn",onClick:t[2]||(t[2]=i=>l(e.page+1)),disabled:e.page===e.totalPages,title:"下一页"},t[6]||(t[6]=[s("i",{class:"ri-arrow-right-s-line"},null,-1)]),8,F),s("button",{class:"pagination-btn",onClick:t[3]||(t[3]=i=>l(e.totalPages)),disabled:e.page===e.totalPages,title:"最后一页"},t[7]||(t[7]=[s("i",{class:"ri-arrow-right-double-line"},null,-1)]),8,I)]))}};export{D as _,E as a,A as c,S as g,T as u};

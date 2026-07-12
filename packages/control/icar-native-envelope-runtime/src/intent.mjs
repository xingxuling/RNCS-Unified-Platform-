import { rootHash, seal, ICARError } from './canonical.mjs';
const normalize=t=>String(t??'').trim().replace(/\s+/g,' ');
export function compileIntent(text,{intentId=null}={}){
 const source=normalize(text); if(!source)throw new ICARError('INTENT_EMPTY');
 const goals=[];
 const progress=source.match(/(?:进度|progress)[^0-9]{0,12}(\d{1,3})/i)??source.match(/(?:提高|提升|设为|改成|到)[^0-9]{0,8}(\d{1,3})\s*%?/i);
 if(progress){const value=Number(progress[1]);if(!Number.isInteger(value)||value<0||value>100)throw new ICARError('INTENT_PROGRESS_OUT_OF_RANGE');goals.push({type:'artifact.progress.target',value});}
 const summary=source.match(/(?:摘要|简介|summary)[：: ]+(.+?)(?=，|。|并|然后|$)/i); if(summary)goals.push({type:'artifact.summary.set',value:summary[1].trim()});
 const milestone=source.match(/(?:添加|加入|新增).{0,4}(?:里程碑|milestone)[：: ]?(.+?)(?=，|。|并|然后|$)/i); if(milestone)goals.push({type:'artifact.milestone.append',value:milestone[1].trim()});
 if(/(生成|创建|制作).{0,8}(报告|汇报)|report/i.test(source))goals.push({type:'artifact.report.generate',format:'markdown'});
 if(/(通知|提醒|推送)|notify|notification/i.test(source))goals.push({type:'host.notification.emit'});
 if(goals.length===0)goals.push({type:'artifact.inspect'});
 const constraints=[]; if(/预览|确认|批准|approve/i.test(source))constraints.push('must-preview-before-commit');
 return seal({format:'icar.intent.v0.2',intent_id:intentId??`intent:${rootHash(source).slice(0,20)}`,source,locale:/[\u3400-\u9fff]/.test(source)?'zh-CN':'en',goals,constraints},'intent_root');
}

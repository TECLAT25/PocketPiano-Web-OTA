(()=>{
  const activeNotes=new Map();
  const lastVelocity=new Map();
  let runningStatus=null;

  const noteNames=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

  const noteLabel=note=>`${noteNames[note%12]}${Math.floor(note/12)-1}`;

  const noteToPosition=note=>{
    if(note<21||note>107)return null;
    if(note<=23)return{module:0,key:note-11};
    const relative=note-24;
    return{module:1+Math.floor(relative/12),key:relative%12+1};
  };

  const positionToNote=(module,key)=>module===0
    ?11+key
    :24+(module-1)*12+(key-1);

  const appendReadableLog=(note,velocity,on)=>{
    const log=document.querySelector('#log');
    if(!log)return;
    const time=new Date().toLocaleTimeString();
    const line=on
      ?`${time} [MIDI] Note On  ${noteLabel(note)} (${note}) velocity=${velocity}`
      :`${time} [MIDI] Note Off ${noteLabel(note)} (${note})`;
    log.textContent+=line+'\n';
    log.scrollTop=log.scrollHeight;
  };

  const renderPiano=()=>{
    document.querySelectorAll('.piano-live-key').forEach(key=>{
      const note=Number(key.dataset.midiNote);
      const velocity=activeNotes.get(note)||0;
      key.classList.toggle('active',velocity>0);
      key.style.setProperty('--midi-strength',String(Math.max(.35,velocity/127)));
      key.dataset.velocity=String(lastVelocity.get(note)||0);
    });
  };

  const renderModuleReading=(note,velocity,on)=>{
    const position=noteToPosition(note);
    if(!position)return;
    const activeModule=Number(document.querySelector('#activeModule')?.textContent);
    if(activeModule!==position.module)return;

    const reading=document.querySelector(`.key-reading[data-key="${position.key}"]`);
    if(!reading)return;

    const output=reading.querySelector('output');
    if(output)output.textContent=String(velocity);
    reading.classList.toggle('midi-active',on);
    reading.style.setProperty('--midi-strength',String(Math.max(.35,velocity/127)));
    reading.dataset.midiNote=String(note);
    reading.dataset.velocity=String(velocity);
  };

  const setNote=(note,on,velocity=0,writeLog=false)=>{
    const position=noteToPosition(note);
    if(!position)return;

    const effectiveVelocity=on?Math.max(1,Math.min(127,velocity||1)):0;
    if(on){
      activeNotes.set(note,effectiveVelocity);
      lastVelocity.set(note,effectiveVelocity);
    }else{
      activeNotes.delete(note);
    }

    renderPiano();
    renderModuleReading(note,on?effectiveVelocity:0,on);
    if(writeLog)appendReadableLog(note,effectiveVelocity,on);
  };

  const messageDataLength=status=>{
    const type=status&0xF0;
    if(type===0xC0||type===0xD0)return 1;
    if(type>=0x80&&type<=0xE0)return 2;
    return 0;
  };

  const processMessage=(status,dataBytes)=>{
    const type=status&0xF0;
    if(type!==0x80&&type!==0x90)return;
    const note=dataBytes[0];
    const velocity=dataBytes[1]??0;
    const on=type===0x90&&velocity>0;
    setNote(note,on,velocity,true);
  };

  const parseBleMidi=packet=>{
    if(!packet||packet.length<2)return;
    let i=1;

    while(i<packet.length){
      const byte=packet[i];

      if(byte>=0xF8){
        i++;
        continue;
      }

      if(byte&0x80){
        const required=messageDataLength(byte);
        if(required>0&&i+required<packet.length){
          let valid=true;
          for(let n=1;n<=required;n++){
            if(packet[i+n]&0x80){valid=false;break;}
          }
          if(valid){
            runningStatus=byte;
            const dataBytes=[];
            for(let n=1;n<=required;n++)dataBytes.push(packet[i+n]);
            processMessage(runningStatus,dataBytes);
            i+=required+1;
            continue;
          }
        }
        i++;
        continue;
      }

      if(runningStatus!==null){
        const required=messageDataLength(runningStatus);
        if(required>0&&i+required-1<packet.length){
          const dataBytes=[];
          let valid=true;
          for(let n=0;n<required;n++){
            const value=packet[i+n];
            if(value&0x80){valid=false;break;}
            dataBytes.push(value);
          }
          if(valid){
            processMessage(runningStatus,dataBytes);
            i+=required;
            continue;
          }
        }
      }
      i++;
    }
  };

  const refreshVisibleModule=()=>{
    const activeModule=Number(document.querySelector('#activeModule')?.textContent);
    document.querySelectorAll('.key-reading').forEach(reading=>{
      const key=Number(reading.dataset.key);
      const note=positionToNote(activeModule,key);
      const velocity=activeNotes.get(note)||0;
      const last=lastVelocity.get(note)||0;
      const output=reading.querySelector('output');
      if(output&&lastVelocity.has(note))output.textContent=String(velocity||last);
      reading.classList.toggle('midi-active',velocity>0);
      reading.style.setProperty('--midi-strength',String(Math.max(.35,velocity/127)));
    });
  };

  const build=()=>{
    document.querySelectorAll('.piano-module').forEach((figure,module)=>{
      let layer=figure.querySelector('.piano-key-layer');
      if(!layer){
        layer=document.createElement('div');
        layer.className='piano-key-layer';
        figure.append(layer);
      }

      const keys=module===0?[10,11,12]:Array.from({length:12},(_,i)=>i+1);
      layer.innerHTML=keys.map(key=>{
        const note=positionToNote(module,key);
        const black=[2,4,7,9,11].includes(key);
        return `<button type="button" class="piano-live-key ${black?'black':'white'}" data-midi-note="${note}" aria-label="Módulo ${module}, tecla ${key}"></button>`;
      }).join('');
    });

    document.querySelectorAll('.piano-live-key').forEach(key=>{
      const note=Number(key.dataset.midiNote);
      key.addEventListener('pointerdown',()=>setNote(note,true,96));
      ['pointerup','pointercancel','pointerleave'].forEach(type=>{
        key.addEventListener(type,()=>setNote(note,false,0));
      });
    });

    const observer=new MutationObserver(refreshVisibleModule);
    const activeModule=document.querySelector('#activeModule');
    const readings=document.querySelector('#keyReadings');
    if(activeModule)observer.observe(activeModule,{childList:true,characterData:true,subtree:true});
    if(readings)observer.observe(readings,{childList:true,subtree:true});

    renderPiano();
    refreshVisibleModule();
  };

  window.addEventListener('pocketpiano-midi',event=>parseBleMidi(event.detail));
  window.PocketPianoMidi={parseBleMidi,setNote};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);
  else build();
})();
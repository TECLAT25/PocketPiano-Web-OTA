(()=>{
  const activeNotes=new Set();
  let runningStatus=null;

  const noteToPosition=note=>{
    if(note<21||note>107)return null;
    if(note<=23)return{module:0,key:note-11};
    const relative=note-24;
    return{module:1+Math.floor(relative/12),key:relative%12+1};
  };

  const positionToNote=(module,key)=>module===0
    ?11+key
    :24+(module-1)*12+(key-1);

  const render=()=>{
    document.querySelectorAll('.piano-live-key').forEach(key=>{
      key.classList.toggle('active',activeNotes.has(Number(key.dataset.midiNote)));
    });
  };

  const setNote=(note,on)=>{
    if(!noteToPosition(note))return;
    if(on)activeNotes.add(note);
    else activeNotes.delete(note);
    render();
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
    setNote(note,type===0x90&&velocity>0);
  };

  const parseBleMidi=packet=>{
    if(!packet||packet.length<2)return;

    // El primer byte es la cabecera de timestamp BLE MIDI.
    let i=1;

    while(i<packet.length){
      const byte=packet[i];

      if(byte>=0xF8){
        i++;
        continue;
      }

      if(byte&0x80){
        const required=messageDataLength(byte);

        // Un estado MIDI válido debe ir seguido por sus bytes de datos.
        // Si no es así, este byte es un timestamp BLE MIDI y se ignora.
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

      // Running Status: después de un timestamp pueden llegar solo los datos.
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
      key.addEventListener('pointerdown',()=>setNote(note,true));
      ['pointerup','pointercancel','pointerleave'].forEach(type=>{
        key.addEventListener(type,()=>setNote(note,false));
      });
    });

    render();
  };

  window.addEventListener('pocketpiano-midi',event=>parseBleMidi(event.detail));
  window.PocketPianoMidi={parseBleMidi,setNote};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);
  else build();
})();
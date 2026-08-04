async function generate_chord(){
  const{invoke}=window.__TAURI__.core;

  const btn=document.getElementById('generateBtn');
  const count=parseInt(document.getElementById('inputNotes').value)||3;
  const startNote=document.getElementById('selectStartNote').value;
  const octave=document.getElementById('selectOctave').value;

  btn.textContent="Generating...";
  btn.style.pointerEvents="none";

  try{
    const data=await invoke('build_chord',{count,startNote,octave});
    addHistoryItem(data,count,startNote,octave);
  }catch(error){
    console.error("Rust Backend Error:",error);
    showError("Failed to generate chord: "+error);
  }finally{
    btn.textContent="Generate Chord";
    btn.style.pointerEvents="auto";
  }
}

function addHistoryItem(sequenceArray,count,startNote,octave){
  const historyList=document.getElementById('history-list');
  const newItem=document.createElement('div');
  newItem.className='history-item';

  const idText=`${count}${startNote}${octave}`;
  const sequenceText=sequenceArray.join(' - ');
  const safeArrayStr=JSON.stringify(sequenceArray).replace(/"/g,"'");

  newItem.innerHTML=`
  <span class="id-tag">${idText}</span>
  <span class="sequence-tag">${sequenceText}</span>
  <div class="btn-group">
    <button class="delete-btn" onclick="deleteHistoryItem(this)" title="Delete Chord">✕</button>
    <button class="play-btn" onclick="playSequence(${safeArrayStr})" title="Play Chord">▶</button>
  </div>
  `;

  historyList.insertBefore(newItem,historyList.firstChild);
}

function deleteHistoryItem(btn){
  const item=btn.closest('.history-item');
  if(!item)return;

  item.style.opacity='0';
  item.style.transform='translateX(-10px)';
  setTimeout(()=>item.remove(),300);
}

function showError(message){
  const historyList=document.getElementById('history-list');
  const errItem=document.createElement('div');
  errItem.className='history-item error-item';
  errItem.textContent=message;

  historyList.insertBefore(errItem,historyList.firstChild)
  setTimeout(()=>{
    errItem.style.opacity='0';
    setTimeout(()=>errItem.remove(),300);
  },4000);
}

const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
const audioCache={};

async function getAudioBuffer(noteClass){
  if(audioCache[noteClass])return audioCache[noteClass];

  const formattedNote=noteClass.replace('#','s');
  const safeNote=encodeURIComponent(formattedNote);
  const url=`./assets/${safeNote}.wav`;

  try{
    const response=await fetch(url);
    if(!response.ok)throw new Error(`File not found: ${url}`);

    const arrayBuffer=await response.arrayBuffer();
    const audioBuffer=await audioCtx.decodeAudioData(arrayBuffer);

    audioCache[noteClass]=audioBuffer;
    return audioBuffer;

  }catch(error){
    console.error(`Audio load error for ${safeNote}.wav:`,error);
    return null;
  }
}

async function playSequence(sequenceArray){
  const currentDelayMs=parseInt(document.getElementById('inputDelay').value)||150;

  if(audioCtx.state==='suspended'){
    await audioCtx.resume();
  }

  const delaySec=currentDelayMs/1000;
  const startTime=audioCtx.currentTime+0.1;

  for(let i=0;i<sequenceArray.length;i++){
    const fullNote=sequenceArray[i];
    const match=fullNote.match(/^([A-G]#?)(\d)$/);
    if(match){
      const noteClass=match[1];
      const targetOctave=parseInt(match[2]);
      const buffer=await getAudioBuffer(noteClass);
      if(buffer){
        const source=audioCtx.createBufferSource();
        source.buffer=buffer;
        source.playbackRate.value=Math.pow(2,targetOctave-5);
        source.connect(audioCtx.destination);
        const playTime=startTime+(i*delaySec);
        source.start(playTime);
      }
    }else{
      console.warn("Could not parse note:",fullNote);
    }
  }
}

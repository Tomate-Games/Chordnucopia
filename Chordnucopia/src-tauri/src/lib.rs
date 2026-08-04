use rand::Rng;

//static NOTE:[&str;12]=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
static NOTE:[&str;12]=["C","G","D","A","E","B","F#","C#","G#","D#","A#","F"];

pub mod func{
    use super::*;

    #[tauri::command]
    pub fn generate_note(start_note:String)->Option<String>{
        let mut rng=rand::thread_rng();
        let r_num:f32=rng.gen_range(0.0..100.0);

        let offset:i32=match r_num{
            i if i>=50.0=>1,
            i if i>=25.0=>2,
            i if i>=12.5=>3,
            i if i>=6.25=>4,
            i if i>=3.125=>5,
            _=>6,
        };
        let start_index=NOTE.iter().position(|&i|i==start_note)?as i32;

        let target_index=if rng.gen_bool(0.5){
            start_index+offset
        }else{
            start_index-offset
        };

        let n_index=target_index.rem_euclid(12)as usize;
        Some(NOTE[n_index].to_string())
    }

    #[tauri::command]
    pub fn build_chord(count:u8,start_note:String,octave:String)->Vec<String>{
        let mut sequence:Vec<String>=vec![format!("{}{}",start_note.clone(),octave)];

        let mut new_note:String=start_note.clone();
        let mut buffer:Option<String>;
        while sequence.len()<count as usize{
            buffer=generate_note(new_note.clone());
            if buffer.is_some(){new_note=buffer.unwrap();}
            if !sequence.iter().any(|i|*i==format!("{}{}",new_note,octave)){
                sequence.push(format!("{}{}",new_note,octave));
            }
        }
        sequence

    }
}

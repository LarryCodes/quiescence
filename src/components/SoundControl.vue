<template>
  <div class="sound-control">
    <button 
      @click="toggleMute"
      :class="['btn', 'btn-sm', 'sound-btn', muted ? 'btn-outline-secondary' : 'btn-outline-primary']"
      :title="muted ? 'Unmute' : 'Mute'"
      aria-label="Toggle mute"
    >
      <i :class="muted ? 'bi bi-volume-mute' : 'bi bi-volume-up'"></i>
    </button>
    <input
      v-if="!muted"
      type="range"
      v-model="volume"
      min="0"
      max="1"
      step="0.1"
      @input="updateVolume"
      class="volume-slider"
      aria-label="Volume control"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { SoundManager } from '../utils/soundUtils';

export default {
  name: 'SoundControl',
  setup() {
    const muted = ref(false);
    const volume = ref(0.5);

    const updateVolume = () => {
      if (SoundManager.audioContext) {
        // Update the gain for all sounds
        const sounds = [
          SoundManager.moveSound,
          SoundManager.captureSound,
          SoundManager.checkSound,
          SoundManager.gameEndSound
        ];
        
        sounds.forEach(sound => {
          if (sound && sound.gainNode) {
            sound.gainNode.gain.setValueAtTime(
              volume.value,
              SoundManager.audioContext.currentTime
            );
          }
        });
      }
    };

    const toggleMute = () => {
      muted.value = !muted.value;
      if (SoundManager.audioContext) {
        if (muted.value) {
          SoundManager.audioContext.suspend();
        } else {
          SoundManager.audioContext.resume();
        }
      }
    };

    onMounted(() => {
      // Initialize volume
      updateVolume();
    });

    return {
      muted,
      volume,
      toggleMute,
      updateVolume,
    };
  },
};
</script>

<style src="@/css/components/SoundControl.css"></style>

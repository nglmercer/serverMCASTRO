import { createSignal, createEffect, For, Show } from 'solid-js';
import { searchMods } from './api';
import { CUSTOM_PLUGINS } from './api';
import ModCard from './ModCard';
import ModDetails from './ModDetails';
import type { Mod } from './index.ts';
import './ModSearch.css';
import { pluginsapi } from 'src/fetch/fetchapi.js';
const ModSearch = () => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [results, setResults] = createSignal<Mod[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [selectedMod, setSelectedMod] = createSignal<Mod | null>(null);
  const [showSearch, setShowSearch] = createSignal(true);

  // Load initial results
  createEffect(() => {
    loadResults();
  });

  const loadResults = async () => {
    setLoading(true);
    try {
      console.log('Loading results for query:');
      const mods = await searchMods(searchQuery());
      setResults([...mods, ...CUSTOM_PLUGINS]);
    } catch (error) {
      console.error('Error loading mods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const query = e.currentTarget.value;
    setSearchQuery(query);
    
    if (query.length < 2 && query !== '') {
      return;
    }
    
    // Debounce search
    const debounceTimer = setTimeout(() => {
      loadResults();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  };

  const handleModClick = (mod: Mod) => {
    setSelectedMod(mod);
    setShowSearch(false);
  };

  const handleBackClick = () => {
    setSelectedMod(null);
    setShowSearch(true);
  };

  const isPluginOrMod = (
    array: { plugins: string[]; mods: string[] },
    loaderList: string[]
  ) => {
    const loaders = loaderList.map((loader) => loader.toLowerCase());
    console.log('Normalized loaders:', loaders);
  
    return {
      plugins: loaders.some((l) => array.plugins.includes(l)),
      mods: loaders.some((l) => array.mods.includes(l)),
    };
  };
  const isValidUrl = (files: any):string | boolean => {
    if (!files)return false;
    if (typeof files === 'string') return files;
    if (typeof files === 'object' && files.url) return files.url;
    if (Array.isArray(files) && files.length > 0) {
      return files[0].url;
    }
    return false;
  }
  const handleDownload = async (versionDetails: any) => {
    console.log('Download requested for version:', versionDetails);
  
    const Loaders = {
      plugins: ['paper', 'purpur', 'spigot', 'velocity', 'sponge','bungeecord'],
      mods: ['forge', 'fabric', 'quilt'],
    };
  
    if (versionDetails.loaders) {
      const verifyLoaders = isPluginOrMod(Loaders, versionDetails.loaders);
      const type = verifyLoaders.plugins ? 'plugins' : 'mods';
      const validurl = isValidUrl(versionDetails.files);
      console.log('verifyLoaders', verifyLoaders,type, validurl);
      if (!validurl) return;
      const result = await pluginsapi.DownloadModorPlugin(window.selectedServer,validurl,type); 
      console.log("result", result);
    }
  };
  
  return (
    <div class="mod-manager">
      <Show when={showSearch()} fallback={
        <ModDetails 
          mod={selectedMod()!} 
          onBack={handleBackClick}
          onDownload={handleDownload}
        />
      }>
        <div class="search-container">
          <h2>Minecraft Mod Manager</h2>
          <div class="search-input-container">
            <input 
              type="text"
              placeholder="Search mods or plugins..."
              value={searchQuery()}
              onInput={handleSearch}
              class="search-input"
            />
          </div>
          
          <Show when={loading()}>
            <div class="loading-indicator">
              <div class="spinner"></div>
              <span>Loading mods...</span>
            </div>
          </Show>
          
          <div class="results-grid">
            <For each={results()}>
              {(mod) => (
                <ModCard mod={mod} onClick={handleModClick} />
              )}
            </For>
          </div>
          
          <Show when={results().length === 0 && !loading()}>
            <div class="no-results">
              <p>No mods found matching your search criteria.</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default ModSearch;
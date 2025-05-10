import { type Component } from 'solid-js';
import type { Mod } from './index.ts';
import './ModCard.css';

interface ModCardProps {
  mod: Mod;
  onClick: (mod: Mod) => void;
}

const ModCard: Component<ModCardProps> = (props) => {
  const handleClick = () => {
    props.onClick(props.mod);
  };

  return (
    <div class="mod-card" onClick={handleClick}>
      <div class="mod-card-image">
        <img 
          src={props.mod.icon_url || props.mod.image || 'https://images.pexels.com/photos/4816921/pexels-photo-4816921.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'} 
          alt={props.mod.title || props.mod.name || 'Minecraft Mod'} 
        />
      </div>
      <div class="mod-card-content">
        <h3>{props.mod.title || props.mod.name || 'Unnamed Mod'}</h3>
        <p>{props.mod.description || 'No description available'}</p>
        {props.mod.isCustom && <span class="mod-card-badge">Custom</span>}
      </div>
    </div>
  );
};

export default ModCard;
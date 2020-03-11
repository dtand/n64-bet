import React, { useState } from 'react';

const AVIS = {
    "captain falcon": require('./img/captain-falcon.png'),
    "donkey kong": require('./img/donkey-kong.png'),
    "fox": require('./img/fox.png'),
    "jigglypuff": require('./img/jigglypuff.png'),
    "kirby": require('./img/kirby.png'),
    "link": require('./img/link.png'),
    "luigi": require('./img/luigi.png'),
    "mario": require('./img/mario.png'),
    "ness": require('./img/ness.png'),
    "pikachu": require('./img/pikachu.png'),
    "samus": require('./img/samus.png'),
    "yoshi": require('./img/yoshi.png'),
}

class CharacterAvi extends React.Component{
    render(){
        return(
            <>
                <img className= { this.props.selected ? 'character-img-selected' : 'character-img' } 
                     src={AVIS[this.props.character.toLowerCase()]}/>
            </>
        )
    }
}

export default CharacterAvi;
import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import CharacterAvi from "./CharacterAvi";
import AnimateOnChange from 'react-animate-on-change';

let numberWithCommas = require('./Utils.js').numberWithCommas;
let toPercentString  = require('./Utils.js').toPercentString;

class PlayerBetPanel extends React.Component{
    render() { return ( 
        <div className={ this.props.player == 1 ? "" : "bet-player" }>           
            <Row>
                <Col className="text-center">
                    <br/>
                    <CharacterAvi   selected={ this.props.userBet > 0 }
                                    character={this.props.character}/>
                    <br/>
                    { this.props.doAnimation != false && <>
                        <div style={{
                            position: "absolute",
                            top: "1%",
                            left: "12%"
                        }}>
                            <h2 className="text-center fade-animation text-success fade-out">
                                    <b>+{numberWithCommas(this.props.doAnimation)}</b>
                            </h2>
                        </div>
                    </> 
                    }
                    <br/>
                    { !this.props.bettingLocked && <>
                            <Button onClick={ () => this.props.betOnPlayer(this.props.player, 1) } 
                                    style={{backgroundColor: '#9147ff'}} 
                                    size="md"> + </Button> 
                            <Button onClick={ () => this.props.betOnPlayer(this.props.player, -1) } 
                                    style={{backgroundColor: '#9147ff'}} 
                                    size="md"> - </Button> 
                        </>
                    }
                </Col>
                <Col className="text-center">
                    <Container>
                        <br/>
                        <h4>
                            Player {this.props.player} | {this.props.character}
                        </h4>
                        <br/>
                        <h4>
                            ${numberWithCommas(this.props.userBet)} 
                         </h4>
                         <br/>
                    </Container>
                </Col>
            </Row>
            <br/>
            <Row>
            <Col className="text-center">
                <Container  className="bet-player-bottom">
                    <Row>
                        <Col>
                            <h5>
                                <Row>
                                    <Col>
                                        Pool
                                    </Col>   
                                    <Col>
                                        <span>${numberWithCommas(this.props.totalBet)}</span>
                                    </Col>
                                </Row>
                            </h5>
                            <h5>
                                <Row>
                                    <Col>
                                        Odds
                                    </Col>   
                                    <Col>
                                        <span>{toPercentString(this.props.odds)}</span>
                                    </Col>
                                </Row>
                            </h5>
                            <h5>
                                <Row>
                                    <Col className={ this.props.userBet > 0 ? "text-success": "text-white" }>
                                        <b>Payout</b>
                                    </Col>
                                    <Col>
                                        <b className={ this.props.userBet > 0 ? "text-success": "text-white" }>
                                            ${ numberWithCommas(this.props.payoutFactor * this.props.userBet) }
                                        </b>
                                    </Col>
                                </Row>
                            </h5>
                        </Col>
                    </Row>
                    </Container>
                </Col>

            </Row>
        </div>  
    )} 
}

export default PlayerBetPanel;
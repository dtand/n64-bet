import React, { useState } from 'react';
import './App.css';
import ReactTwitchEmbedVideo from "react-twitch-embed-video";
import { Row, Col, Container, Button } from 'reactstrap';
import './index.css';
import PlayerBetPanel from './PlayerBet.js';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import openSocket from "socket.io-client";

let apiPrefix = "https://n64-bet.herokuapp.com/";

if (window.location.href.indexOf("localhost") > -1) {
    apiPrefix = "http://localhost:8080/";
}

let numberWithCommas = require('./Utils.js').numberWithCommas;

var socket = openSocket(apiPrefix);

socket.on('connect', function(data) {
   console.log("connected");
   socket.emit('join', 'Hello World from client');
});

socket.on('disconnect', function(data) {
    console.log("disconnected");
    socket = openSocket(apiPrefix);
 });
 

class N64Bet extends React.Component{

    state = {
        loading: true,
        loadingBetSection: false,
        username: "",
        balance: 0,
        games: [],
        gameData: {},
        userBets: [0,0,0,0],
        userTotal: 0,
        playerSums: [],
        currentGameId: -1,
        bettingLocked: false,
        hasSubmitted: false,
        newBets: [false,false,false,false],
        betKeys: [0,0,0,0]
    }

    parseUsername = () => {
        let search   = window.location.search;
        let params   = new URLSearchParams(search);
        return params.get('username');
    }

    loadHistoricalGames = () => {
        fetch(prefix + 'v1/games')
        .then(res => res.json())
        .then((data) => {
            this.setState({
                games: data,
                currentGameId: data[data.length - 1]['id']
            });
            this.loadCurrentGameInfo(data[data.length - 1]['id']);
        })
        .catch(console.log)
    }

    loadPlayerBalance = () => {
        let username = ""
        if (this.state.username == ""){
            username = this.parseUsername();
        }
        else{
            username = this.state.username;
        }
        fetch(apiPrefix + 'v1/balance?username=' + username)
        .then(res => res.json())
        .then((data) => {
            console.log(data);
            this.setState({
                balance: data.balance
            })
        })
        .catch(console.log)
    }

    loadCurrentGameInfo = (id, resetBets) => {
        console.log("grabbing game info: " + id);
        if(id == undefined){
            id = this.state.currentGameId;
            console.log("grabbing game info: " + id);
            if(id == undefined || id < 0)
                return;
        }
        fetch(apiPrefix + 'v1/game?id=' + id)
        .then(res => res.json())
        .then((data) => {
            console.log(data);
            let userBets  = [0,0,0,0]
            let userTotal = 0
            const bets = data['bets'];
            for(let i = 0; i < bets.length; i++){
                if(bets[i]['username'] == this.state.username){
                    userTotal += bets[i]['total_bet'];
                    userBets[bets[i]['player_id']-1] = bets[i]['total_bet'];
                }
            }
            
            this.setState({
                gameData: data,
                playerSums: data['player_sums'],
                loading: false,
                userTotal: userTotal,
                userBets: userBets,
                bettingLocked: (userTotal > 0 || this.state.hasSubmitted),
                loadingBetSection: false,
                currentGameId: data['id'] 
            });
        })
        .catch(console.log)
    }

    submitBets = () => {
        let bets = []
        const self = this;

        for(let i = 0; i < this.state.userBets.length; i++){
            if(this.state.userBets[i] > 0){
                bets.push({
                    bet: this.state.userBets[i],
                    player: i+1
                });
            }
        }
        let requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                game_id: this.state.currentGameId,
                username: this.state.username,
                bets: bets
             })
        };
        
        fetch(apiPrefix + 'v1/bets', requestOptions)
            .then(response => response.json())
            .then((data) => {
                if(data["success"]){
                    self.loadCurrentGameInfo();
                }
                else{
                    console.log(data["message"])
                }
            });

        NotificationManager.success('Your bets have been locked with a total wager of: ' + this.state.userTotal, 'Bets locked');
        
        this.setState({
            hasSubmitted: true,
            bettingLocked: true
        });
    }

    updateTotalBet = (bet) => {
        let gameData = this.state.gameData;
        gameData.total_pot += bet;
        this.setState({
            userTotal: this.state.userTotal + bet,
            gameData: gameData
        });
    }

    betOnPlayer = (player, bet) => {
        if(bet < 0 && this.state.userBets[player-1] == 0){
            return;
        }
        let gameData = this.state.gameData;
        gameData.total_pot += bet;
        let ub = this.state.userBets;
        let ps = this.state.playerSums;
        ub[player-1] = ub[player-1] + bet;
        ps[player-1] = ps[player-1] + bet;
        this.setState({
            userTotal: this.state.userTotal + bet,
            userBets: ub,
            playerSums: ps,
            gameData: gameData
        });
    }

    componentDidMount() {
        this.loadHistoricalGames();
        this.loadPlayerBalance();
        this.setState({
            username: this.parseUsername()
        });

        const self = this;

        socket.on('new_bets', function(data) {
            console.log(data);
            if(data.username == self.state.username)
                return;
            let playerSums  = self.state.playerSums;
            let newBets     = self.state.newBets;
            let gameData    = self.state.gameData;
            let betKeys     = self.state.betKeys;
            console.log(gameData);
            for(let i = 0; i < data.bets.length; i++){
                playerSums[data.bets[i].player-1] += Number(data.bets[i].bet);
                if(data.bets[i] != 0){
                    newBets[data.bets[i].player-1] = Number(data.bets[i].bet);
                    betKeys[data.bets[i].player-1]++;
                }
                else
                    newBets[data.bets[i].player-1] = false;
                gameData.total_pot += Number(data.bets[i].bet);
            }
            console.log(gameData);
            self.setState({
                playerSums: playerSums,
                newBets: newBets,
                gameData: gameData,
                betKeys: betKeys
            });
        });

        socket.on('game_resolved', function(data) {
            console.log("game resolved..");
            NotificationManager.success('The game has completed and the winner is: player ' + data.winner, 'Game Completed');
            self.loadPlayerBalance();
            self.loadCurrentGameInfo();
        });

        socket.on('new_game', function(data) {
            console.log("new game..");
            NotificationManager.success('A new game lobby has started!', 'New Game');
            self.loadCurrentGameInfo(self.state.currentGameId + 1, true);
        });
    }

    componentWillUnmount() {
        this.timer = null;
    }

    render(){ return (
        <div className="App bg-all">
            <Row className="nav text-white">
                <Col sm="1"/>
                <Col className="text-left">
                    <h3>N64 BET | Smash Bros</h3>
                </Col>
                <Col className="text-right">
                    <h3>
                        <span className="primary-color">{ this.state.username }</span> | Balance: 
                        ${ numberWithCommas(this.state.balance) }
                    </h3>
                </Col>
                <Col sm="1"/>
            </Row>
            { this.state.loading && 
                <div>
                    <h1 style={{
                        "position": "absolute",
                        "top": "50%",
                        "left": "50%"
                    }}>
                        <div className="animate-flicker">Loading...</div>
                    </h1>
                </div> 
            }
        { !this.state.loading && <>
            <section className="video-section">
                <br/>
                <ReactTwitchEmbedVideo height="512px" width="100%" chat="false" channel="dtravas" />
                { !this.state.bettingLocked &&
                    <div className="text-left pad-left-20">
                        <Button onClick={ this.submitBets } 
                                style={{backgroundColor: '#9147ff'}} 
                                size="sm"> 
                            PLACE BETS
                        </Button>
                    </div>
                }{ this.state.bettingLocked && 
                    <h5 className="text-white">
                        YOUR BETS ARE SUBMITTED
                    </h5>
                }
                <Row className="game-info-banner">
                    <Col className="text-left">
                        <div className="pad-left-20">
                            POT SIZE ${numberWithCommas(this.state.gameData['total_pot'])} | 
                            YOUR BETS ${numberWithCommas(this.state.userTotal)} 
                        </div>
                    </Col>
                    <Col className="text-right">
                        <div className="pad-right-20">
                            GAME: {this.state.currentGameId} | MIN BET {1} | MAX BET {100} | BETTING IS {
                                this.state.gameData["betting_open"] && 
                                    <span className="text-success">
                                        <b>OPEN</b>
                                    </span> 
                                }{ !this.state.gameData["winner"] && !this.state.gameData["betting_open"] &&                                    
                                    <span className="text-danger">
                                        <b>CLOSED</b>
                                    </span>
                                }{ this.state.gameData["winner"] &&
                                    <span className="text-success">
                                        <b>RESOLVED - PLAYER { this.state.gameData["winner"] } WON</b>
                                    </span>
                                }
                        </div>   
                    </Col>
                </Row>
            </section>
            </> }
            { !this.state.loading && <section className= { this.state.bettingLocked ? "bet-section-locked" : "bet-section" }>   
                <Row>
                    <Col>
                    <Row className="text-black">
                        <Col>
                        <PlayerBetPanel player={1} 
                                        key={ "p1-" + this.state.betKeys[0] }
                                        doAnimation={ this.state.newBets[0] }
                                        character={ this.state.gameData['metadata']['characters'][0] } 
                                        totalBet={ this.state.playerSums[0] }
                                        userBet={ this.state.userBets[0] }
                                        odds={ this.state.gameData['total_pot'] == 0 ? 0 : 
                                            this.state.playerSums[0] / this.state.gameData['total_pot']
                                            }
                                        payoutFactor={ this.state.playerSums[0] == 0 ? 0 : 
                                            this.state.gameData['total_pot'] / this.state.playerSums[0] 
                                        }
                                        betOnPlayer={ this.betOnPlayer }
                                        updateTotalBet={ this.updateTotalBet }
                                        bettingLocked={ this.state.bettingLocked }/>
                        </Col>
                        <Col>
                        <PlayerBetPanel player={2} 
                                        key={ "p2-" + this.state.betKeys[1] }
                                        doAnimation={ this.state.newBets[1] }
                                        character={ this.state.gameData['metadata']['characters'][1] } 
                                        totalBet={ this.state.playerSums[1] }
                                        userBet={ this.state.userBets[1] }
                                        odds={ this.state.gameData['total_pot'] == 0 ? 0 : 
                                            this.state.playerSums[1] / this.state.gameData['total_pot']
                                            }
                                        payoutFactor={ this.state.playerSums[1] == 0 ? 0 : 
                                            this.state.gameData['total_pot'] / this.state.playerSums[1] 
                                            }
                                            betOnPlayer={ this.betOnPlayer }
                                            updateTotalBet={ this.updateTotalBet }
                                            bettingLocked={ this.state.bettingLocked }/>
                        </Col>
                        <Col>
                        <PlayerBetPanel player={3} 
                                        key={ "p3-" + this.state.betKeys[2] }
                                        doAnimation={ this.state.newBets[2] }
                                        character={ this.state.gameData['metadata']['characters'][2] } 
                                        totalBet={ this.state.playerSums[2] }
                                        userBet={ this.state.userBets[2] }
                                        odds={ this.state.gameData['total_pot'] == 0 ? 0 : 
                                            this.state.playerSums[2] / this.state.gameData['total_pot']
                                            }
                                        payoutFactor={ this.state.playerSums[2] == 0 ? 0 : 
                                            this.state.gameData['total_pot'] / this.state.playerSums[2] 
                                        }
                                        betOnPlayer={ this.betOnPlayer }
                                        updateTotalBet={ this.updateTotalBet }
                                        bettingLocked={ this.state.bettingLocked }/>
                        </Col>
                        <Col>
                        <PlayerBetPanel player={4} 
                                        key={ "p4-" + this.state.betKeys[3] }
                                        doAnimation={ this.state.newBets[3] }
                                        character={ this.state.gameData['metadata']['characters'][3] } 
                                        totalBet={ this.state.playerSums[3] }
                                        userBet={ this.state.userBets[3] }
                                        odds={ this.state.gameData['total_pot'] == 0 ? 0 : 
                                            this.state.playerSums[3] / this.state.gameData['total_pot']
                                            }
                                        payoutFactor={ this.state.playerSums[3] == 0 ? 0 : 
                                            this.state.gameData['total_pot'] / this.state.playerSums[3] 
                                        }
                                        betOnPlayer={ this.betOnPlayer }
                                        updateTotalBet={ this.updateTotalBet }
                                        bettingLocked={ this.state.bettingLocked }/>
                        </Col>
                    </Row>
                    </Col>
                </Row>
                </section>
            }{ !this.state.loading && this.state.loadingBetSection && 
                <section className="bet-section text-center"> 
                    <h3>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        <div className="animate-flicker"> Fetching new bets...</div>
                        <br/>
                        <br/>
                        <br/>
                    </h3>
                </section>}
            <NotificationContainer/>
      </div>
    )}
}

export default N64Bet;
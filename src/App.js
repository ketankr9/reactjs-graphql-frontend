import React from 'react';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ApolloProvider, Query, Mutation } from "react-apollo";
import ApolloClient from "apollo-boost";

import {QueryGetTopNUsers, CREATE_USER, UPDATE_USER, QueryGetAllUsersSorted, QueryGetAllUsers} from './Queries';

const log = (st) => console.log(st);

const getLocalStorage = () => {
    let ret = {};
    try{
        ret = JSON.parse(localStorage.getItem("gameXYZstate")) || {};
    }catch(err){
        console.log("Error parsing localStorage");
        localStorage.setItem("gameXYZstate", JSON.stringify("{}"))
        ret = {}
    }
    return ret;
};

const setLocalStorage = (newLocalState) => {
    console.assert(newLocalState, "null or undefined");
    localStorage.setItem("gameXYZstate", JSON.stringify(newLocalState));
};


const GRAPHQL_SERVER = window.location.hostname === "localhost" ? "http://localhost:8080/graphql" : "https://superna.serveo.net/graphql";
console.log("GRAPHQL_SERVER: ", GRAPHQL_SERVER);
const client = new ApolloClient({ uri: GRAPHQL_SERVER });

class ScoreBoard extends React.Component{

    buildTableRow(userList){
        return userList.map((e, idx) => <tr key={e.id}>
                <td>{idx}</td>
                <td>{e.name}</td>
                <td>{e.score}</td>
            </tr> );
    }

    render(){
        return(
            <ApolloProvider client={client}>
            <div>
              <h3>Score Board</h3>
              <Query query={QueryGetAllUsersSorted}>
                {props => {
                    const { error, loading, data } = props;
                    if (error) return <div>*ERROR*: {JSON.stringify(error)}</div>;
                    if (loading) return <div>*LOADING*...</div>;
                    if (!data && !data.users) return <div>No Books Found!</div>;
                    return (
                        <table>
                            <thead><tr><th>Rank</th><th>Name</th><th>Score</th></tr></thead>
                            <tbody>{this.buildTableRow(data.users)}</tbody>
                        </table>
                    );
                }}
              </Query>
            </div>
          </ApolloProvider>

        );
    }
}

class Game extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            currentScore: this.props.restoredState.currentScore || 0,
            maxScore: this.props.restoredState.maxScore || 0,
            name: this.props.restoredState.name,
            id: this.props.restoredState.id,
            score: this.props.restoredState.score
        }
    }

    getPoints(){
        const s = this.state;
        const pointsEarned = s.currentScore ? s.maxScore - s.currentScore : s.maxScore*s.maxScore;
        return pointsEarned;
    }

    updateLocalStorage(){
        setLocalStorage(this.state);
        this.props.onUpdateUserScore(this.state.score)
    }

    incrementScore(i){
        const newScore = this.state.currentScore+i;
        if(newScore < 0)
            return;
        this.setState({
            currentScore: newScore,
            maxScore: Math.max(this.state.maxScore, newScore)
        }, () => this.updateLocalStorage() );
    }

    render(){
        return (
            <div>
                <div>
                    <label>Max Value</label>:<input readOnly={true} value={this.state.maxScore}/>
                    <br/>
                    <label>Current Value</label>:<input readOnly={true} value={this.state.currentScore}/>
                </div>
                <div>
                    <button onClick={ () => this.incrementScore(+1) }>+</button>
                    <button onClick={ () => this.incrementScore(-1) }>-</button>
                    <ApolloProvider client={client}>
                    <Mutation mutation={UPDATE_USER}
                        onCompleted={(data)=> {
                            console.log(data)
                            toast(`🦄 You earned ${data.user.score} points`)
                            this.setState({maxScore: 0, currentScore: 0, score: data.user.score}, () => this.updateLocalStorage())
                        }}
                        variables = {{id: this.state.id, score: this.getPoints()}}>
                            {updateUser => <button onClick={updateUser}>Collect</button> }  
                    </Mutation>
                    </ApolloProvider>
                </div>
            </div>
        );
    }
}

class Timer extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            timeElapsed : 0,
        }
    }

    tick(){
        this.setState({
            timeElapsed: Math.floor((new Date() - this.startTime)/1000),
        });
    }

    componentDidMount(){
        this.startTime = new Date();
        this.timerId = setInterval( () => this.tick(), 1000);
    }

    componentWillUnmount(){
        clearInterval(this.timerId);
    }

    render(){
        return(
            <div>{this.state.timeElapsed} seconds</div>
        );
    }
}

class GameBoard extends React.Component {
    constructor(props){
        super(props)

        const restoredState = getLocalStorage();
        this.state = {
            restoredState: restoredState,
            tmpName: null
        }
    }

    updateNameState(event){
        this.setState({
            tmpName : event.target.value,
        });
    }

    render(){
        if(!this.state.restoredState.name){
            return(
                <div>
                    <h1>Game</h1>
                    <input type="text" name="name" value={this.state.restoredState.name} onChange={ this.updateNameState.bind(this) }/>
                    <ApolloProvider client={client}>
                    <Mutation mutation={CREATE_USER}
                        onCompleted={(data) => { this.setState({ restoredState: data.user }, () => setLocalStorage(this.state.restoredState)); } }
                        variables = {{name: this.state.tmpName}}>
                            {createUser => <button onClick={createUser}>Set Name</button> }  
                    </Mutation>
                    </ApolloProvider>
                </div>
            );
        }
        
        return(
            <div>
                <h1>Game</h1>
                <label>Welcome </label> 
                <label key={this.state.restoredState.id}>{this.state.restoredState.name + ", Score: " + this.state.restoredState.score}</label>
                <Game 
                    restoredState={this.state.restoredState} onUpdateUserScore={ (x) => { 
                        const restoredState = this.state.restoredState;
                        restoredState.score = x;
                        this.setState({restoredState: restoredState})
                    } }
                />
                <Timer/>
                <ToastContainer/>
            </div>
        );
    }
}

export {
    GameBoard,
    ScoreBoard
}
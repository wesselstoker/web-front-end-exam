import React from 'react';
import ReactDOM from 'react-dom';

import styles from './App.css';

(() => {

    'use strict';

    const MAX_RESULTS                     = 50;
    const DEFAULT_THUMBNAIL               = 'https://myspace.com/common/images/user.png';
    const DEFAULT_SPOTIFY_THUMBNAIL_INDEX = 2;

    // keep track of all the search results
    let searchModel = new function(){

        let model = [];
        this.add = item => model.push({
            id        : item.id,
            name      : item.name,
            href      : item.external_urls.spotify,
            image     : item.images[ DEFAULT_SPOTIFY_THUMBNAIL_INDEX ] ? item.images[ DEFAULT_SPOTIFY_THUMBNAIL_INDEX ].url : DEFAULT_THUMBNAIL,
            followers : item.followers ? item.followers.total : 0
        });

        this.getAll    = () => model;
        this.removeAll = () => model = [];

    };

    // keep track of the favorites
    let favoritesModel = new function(){

        let model     = Object.create( null );
        this.add      = item  => model[ item.id ] = item;
        this.getAll   = ()    => Object.keys( model ).map( id => model[ id ] );
        this.remove   = item  => delete model[ item.id ];
        this.setItems = items => items.map( item => model[ item.id ] = item );

    };

    let App = React.createClass({
        getInitialState : () => {
            // create a intial search query
            return {
                query : null
            };
        },
        // the reason why I am using a normal function instead of
        // a arrow function(=>) is because I want to use the 'this'.
        // the meaning of 'this' is different if you are using =>
        componentDidMount : function(){
            // make sure that there are results loaded after mounting
            this.search( this.state.query );
            // load the favorites
            this.loadFavorites();
        },
        search : query => {
            // empty artists model
            searchModel.removeAll();

            if( !query ) return render();
            else{
                // retrieve results and them in the empty artists model
                fetch( 'https://api.spotify.com/v1/search?q=' + query + '&type=artist&limit=' + MAX_RESULTS )
                    .then( result => result.json() )
                    .then( json => json.artists.items.forEach( searchModel.add ))
                    .then( render )
                    .catch( err => console.error( err ));
            }

        },
        handleChange: function( event ){
            // listen to the input and update the state if it is necessary
            const query = event.target.value;
        	this.setState( { query : query } );
            // refresh results
            this.search( query );
        },
        addToFavorites : function( item ){
            // update favorites model and save it in localStorage
            favoritesModel.add( item );
            this.setFavorites();
        },
        removeFromFavorites : function( item ){
            // update favorites model and save it in localStorage
            favoritesModel.remove( item )
            this.setFavorites();
        },
        setFavorites : () => {
            // set the favorites in localStorage
            localStorage.setItem( 'favorites', JSON.stringify( favoritesModel.getAll() ));
            render();
        },
        loadFavorites : () => {
            // load the favorites from localStorage and put them in the favorites model
            favoritesModel.setItems( JSON.parse( localStorage.getItem( 'favorites' ) ) || [] );
        },
        render: function(){

            const TOTAL_RESULTS   = searchModel.getAll().length;
            const TOTAL_FAVORITES = favoritesModel.getAll().length;

            // search results
            let searchList = searchModel.getAll().map( item => {
                const FOLLOWERS = item.followers + ( item.followers === 1 ? ' follower' : ' followers' );
                return (
                    <div className={ styles.item } key={ item.id } onClick={() => this.addToFavorites( item ) }>
                        <img src={ item.image } />
                        <div className={  styles.name } >{ item.name }</div>
                        <div className={  styles.followers } >{ FOLLOWERS }</div>
                    </div>
                );
            }, this );

            // search view
            let search = (
                <div className={ searchList.length ? styles.search : styles[ 'search-no-results' ]  }>
                    <input
                        value={ this.state.query }
                        className={ styles.input }
                        placeholder='Search and find your favorite artists'
                        onChange={ this.handleChange }
                        autoFocus
                    />
                    <div className={ styles.counter }>
                        { TOTAL_RESULTS === 1 ? TOTAL_RESULTS + ' result' : TOTAL_RESULTS + ' results' }
                    </div>
                    <div className={ styles.list }>{ searchList }</div>
                </div>
            );

            // favorites view
            let favoritesList = favoritesModel.getAll().map( item => {
                const FOLLOWERS = item.followers + ( item.followers === 1 ? ' follower' : ' followers' );
                return (
                    <div className={ styles.item } key={ item.id } onClick={() => this.removeFromFavorites( item ) }>
                        <img src={ item.image } />
                        <div className={  styles.name } >{ item.name }</div>
                        <div className={  styles.followers } >{ FOLLOWERS }</div>
                    </div>
                );
            }, this );

            // favorites list
            let favorites = (
                <div className={ favoritesList.length ? styles.favorites : styles[ 'favorites-no-results' ]  }>
                    <div className={ styles[ 'favorites-title' ] }>My favorites</div>
                    <div className={ styles.counter }>
                        { TOTAL_FAVORITES === 1 ? TOTAL_FAVORITES + ' favorite' : TOTAL_FAVORITES + ' favorites' }
                    </div>
                    <div className={ styles.list }>{ favoritesList }</div>
                </div>
            )

            // put all the views together
            return (
                <div className={ styles.app }>
                    { search }
                    { favorites }
                </div>
            );
        }
    });

    let render = () => {
        // mount app on the DOM
        ReactDOM.render( <App />, document.getElementById( 'root' ) );
    };

    render();

})();

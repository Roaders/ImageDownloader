# ImageDownloader

[![Greenkeeper badge](https://badges.greenkeeper.io/Roaders/ImageDownloader.svg)](https://greenkeeper.io/)

A simple node script to scrape a webpage for matching urls and download them all to an output folder.

## Installation

`git clone https://github.com/Roaders/ImageDownloader.git ImageDownloader`

`cd ImageDownloader`

`npm install`

## Usage

`node index.js http://mydomain.com`

This will download all the `.jpg` images on your homepage

`node index.js http://mydomain.com href=\"([^\"]*.png)\"`

This will download all of the png files on your homepage

## Cookies

If you need to access a webpage that relies on cookie information to log you in copy the cookie information from your browser dev tools and save it in a `cooke.txt` alongside index.js

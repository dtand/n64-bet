class FadingText extends React.Component {
    constructor() {
      super();
      this.state = {
        show: false
      };
      this.showNotification = this.showNotification.bind(this);
    }

    componentDidMount(){
        setTimeout(() => {
            this.setState({
              show: false,
            });
          }, 1000);
    }
    
    render() {
      return (
        <div>
          <span className={this.props.show ? 'show' : ''}>Saved!</span>
        </div>
      );
    }
  
  }
  
  class Notification extends React.Component {
    render() {
      return 
    }
  }
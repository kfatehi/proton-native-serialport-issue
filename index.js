import React, { Component } from 'react';
import { render, Window, App, Button, Group, Box, Grid, Picker, Text, Dialog } from 'proton-native';
import SerialPort from 'serialport';

class PortPicker extends Component {
  handleSelect(i) {
    this.props.onSelect(this.props.ports[i]);
  }
  render() {
    if (this.props.ports.length) {
      return <Picker onSelect={(i)=>this.handleSelect(i)} selected={this.props.ports.length ? 0 : -1}>
        {this.props.ports.map(port =>
          <Picker.Item key={port.comName}>{port.comName}</Picker.Item>
        )}
      </Picker>;
    } else {
      return <Text>{"No ports available"}</Text>
    }
  }
}

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      ports: [],
      serialBusy: false,
    };
  }
  componentDidMount() {
    this.refreshPorts();
    
    // Workaround to make the disabled fields actually look disabled on start.
    this.setState({ connected: true })
    setTimeout(() => { this.setState({ connected: false }) }, 100)
  }
  refreshPorts() {
    this.setState({ serialBusy: true })
    SerialPort.list((err, ports)=> {
      this.setState({ serialBusy: false, ports })
    });
  }
  selectPort(port) {
    this.setState({ port });
  }
  connect() {
    this.setState({ serialBusy: true });
    this.serialport = new SerialPort(this.state.port.comName, { autoOpen: false });

    this.serialport.on('open', ()=>{
      this.setState({ connected: true, serialBusy: false });
    })

    this.serialport.open(function (err) {
      if (err) {
        Dialog('Error', { title: "Error opening port", description: err.message })
        this.setState({ connected: false, serialBusy: false });
      }
    });
  }
  closePort() {
    this.serialport.close(()=>{
      this.serialport = null;
      this.setState({ connected: false })
    });
  }
  canConnect() {
    return !!this.state.port;
  }
  canDisconnect() {
    return !this.state.serialBusy;
  }
  handleCloseWindow() {
    if (this.state.connected)
      this.serialport.close(() => process.exit(0));
    else
      process.exit(0);
  }
  render() {
    return (
      <App>
        <Window onClose={() => this.handleCloseWindow()} lastWindow={false} margined={true} title="ProtonSerialPort" size={{ w: 200, h: 200 }} menuBar={false}>
          <Group title="Connect">
            <Box vertical={false} padded={true}>
              <Box>
                <Button enabled={!this.state.serialBusy} onClick={() => this.refreshPorts()}>Rescan Ports</Button>
                <PortPicker
                  ports={this.state.ports}
                  onSelect={port => this.selectPort(port)}
                />
              </Box>
              <Button
                enabled={!!this.state.port && !this.state.serialBusy}
                onClick={() => this.state.connected ? this.closePort() : this.connect()}>
                {this.state.connected ? "Disconnect" : "Connect"}
              </Button>
            </Box>
          </Group>
        </Window>
      </App>
    );
  }
}

render(<Example />);
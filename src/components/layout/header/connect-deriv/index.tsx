import './connect-deriv.scss';

type Props = {
    onLogin: () => void;
    onSignup: () => void;
};

const ConnectDerivDropdown = ({ onLogin, onSignup }: Props) => {
    return (
        <div className='connect-deriv'>
            <button className='connect-deriv__login' onClick={onLogin}>
                Log In
            </button>
            <button className='connect-deriv__signup' onClick={onSignup}>
                Sign Up
            </button>
        </div>
    );
};

export default ConnectDerivDropdown;

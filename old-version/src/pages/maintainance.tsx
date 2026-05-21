// Viết một trang thông báo bảo trì cho website của bạn. Trang này nên có một thông điệp rõ ràng về việc bảo trì đang diễn ra, thời gian dự kiến hoàn thành, và cách liên hệ nếu người dùng cần hỗ trợ. Với hoạt ảnh động để làm cho trang thêm sinh động.
import React from 'react';

const MaintenancePage: React.FC = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h1 style={styles.title}>🔧 Chúng tôi đang bảo trì 🔧</h1>

                    {/* Animated Workers */}
                    <div className="justify-around mb-10" style={styles.workersContainer}>
                        <img src={"./maintainance.svg"} alt="Animated SVG" width="500" />
                    </div>
                    <p style={styles.message}>
                        Xin lỗi vì sự bất tiện này. Chúng tôi đang thực hiện một số công việc bảo trì để cải thiện trải nghiệm của bạn.
                    </p>

                    <p style={styles.contact}>
                        Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email:{' '}
                        <a href="mailto:minhquandoanngoc@gmail.com" style={styles.email}>
                            minhquandoanngoc@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        textAlign: 'center' as 'center',
        padding: '40px 20px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '60px 40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        animation: 'slideIn 0.8s ease-out'
    },
    title: {
        fontSize: '2.5em',
        color: '#333',
        marginBottom: '30px',
        animation: 'bounce 2s infinite'
    },
    workersContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        marginBottom: '40px',
        alignItems: 'flex-end',
        height: '150px'
    },
    worker: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    head: {
        fontSize: '3em',
        marginBottom: '10px',
        animation: 'rotate 2s infinite'
    },
    body: {
        width: '40px',
        height: '50px',
        backgroundColor: '#667eea',
        borderRadius: '10px',
        marginBottom: '10px'
    },
    wrench: {
        fontSize: '2em',
        animation: 'swing 1.5s infinite'
    },
    message: {
        fontSize: '1.1em',
        color: '#666',
        lineHeight: '1.6',
        marginBottom: '30px'
    },
    loadingContainer: {
        marginBottom: '30px'
    },
    loadingText: {
        color: '#999',
        fontSize: '0.9em',
        marginTop: '10px'
    },
    contact: {
        color: '#666',
        fontSize: '1em'
    },
    email: {
        color: '#667eea',
        textDecoration: 'none' as 'none',
        fontWeight: 'bold' as 'bold',
        transition: 'color 0.3s ease'
    }
};

export default MaintenancePage;
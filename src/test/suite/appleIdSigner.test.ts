import * as assert from 'assert';
import * as fs from 'fs';
import { AppleIdSigner } from '../../services/appleIdSigner';

export async function testAppleIdSigner() {
    console.log('  Testing Apple ID Signer & Certificate Lifecycle...');

    const email = 'developer.test@libreswift.io';
    const metadata = await AppleIdSigner.generateDevelopmentCertificate(email, 'iPhone Developer: Test Dev');

    assert.strictEqual(metadata.email, email);
    assert.strictEqual(metadata.mode, 'free-apple-id');
    assert.ok(metadata.serialNumber.length > 0);

    const keyPath = AppleIdSigner.getKeyPath();
    const certPath = AppleIdSigner.getCertPath();
    const provisionPath = AppleIdSigner.getProvisionPath();

    assert.ok(fs.existsSync(keyPath), 'Key file must be generated');
    assert.ok(fs.existsSync(certPath), 'Cert file must be generated');
    assert.ok(fs.existsSync(provisionPath), 'Mobileprovision must be generated');

    const status = AppleIdSigner.getCertificateStatus();
    assert.strictEqual(status.exists, true, 'Certificate status must exist');
    assert.strictEqual(status.valid, true, 'Newly created certificate must be valid');
    assert.ok(status.daysRemaining >= 6, 'Should have ~7 days remaining');
    assert.strictEqual(status.email, email);

    // Test profile update
    const updatedProfile = AppleIdSigner.generateProvisioningProfile('com.test.App');
    const profileContent = fs.readFileSync(updatedProfile, 'utf8');
    assert.ok(profileContent.includes('LIBRESWIFT.com.test.App'), 'Entitlements must include target bundle ID');
    assert.ok(profileContent.includes('get-task-allow'), 'Profile must enable get-task-allow for debugging');

    console.log('    ✓ Passed: Apple ID Signer successfully generates and validates 7-day developer certificates');
}
